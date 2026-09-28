/**
 * Доступ к Postgres.
 *
 *  • Прод (Supabase): DATABASE_URL → node-postgres. Берите строку «Transaction pooler»
 *    (порт 6543) из Supabase → Project Settings → Database.
 *  • Разработка без БД: если DATABASE_URL не задан — встроенный Postgres (PGlite),
 *    данные лежат в .data/pglite, миграции применяются автоматически.
 *
 * Весь SQL в проекте один и тот же для обоих режимов.
 */
import fs from 'node:fs';
import path from 'node:path';

export interface Queryable {
  query<T = any>(sql: string, params?: unknown[]): Promise<T[]>;
}
export interface Db extends Queryable {
  /** Выполнить несколько SQL-команд подряд (без параметров) */
  exec(sql: string): Promise<void>;
  tx<T>(fn: (q: Queryable) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

const g = globalThis as unknown as { __dgtDb?: Promise<Db> };

export function getDb(): Promise<Db> {
  if (!g.__dgtDb) {
    g.__dgtDb = createDb().catch((e) => {
      g.__dgtDb = undefined;
      throw e;
    });
  }
  return g.__dgtDb;
}

/** Для тестов: подменить БД */
export function setDb(db: Db | null) {
  g.__dgtDb = db ? Promise.resolve(db) : undefined;
}

async function createDb(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) return createPg(url);
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_PGLITE_IN_PROD) {
    throw new Error('DATABASE_URL не задан. Возьмите строку подключения в Supabase → Settings → Database.');
  }
  const db = await createPglite(process.env.PGLITE_DIR || '.data/pglite');
  await applyMigrations(db);
  return db;
}

async function createPg(url: string): Promise<Db> {
  const pg = await import('pg');
  // bigint (telegram_id, count) → number: значения помещаются в 2^53
  pg.types.setTypeParser(20, (v: string) => Number(v));
  const ssl = process.env.DATABASE_SSL === 'disable' ? undefined : { rejectUnauthorized: false };
  const pool = new pg.Pool({ connectionString: url, max: 3, ssl });
  return {
    async query(sql, params) {
      return (await pool.query(sql, params as any[])).rows;
    },
    async exec(sql) {
      await pool.query(sql);
    },
    async tx(fn) {
      const c = await pool.connect();
      try {
        await c.query('begin');
        const r = await fn({ query: async (s, p) => (await c.query(s, p as any[])).rows });
        await c.query('commit');
        return r;
      } catch (e) {
        await c.query('rollback').catch(() => {});
        throw e;
      } finally {
        c.release();
      }
    },
    close: () => pool.end(),
  };
}

/** bigint из PGlite приходит как BigInt — приводим к number */
function normalize<T>(rows: T[]): T[] {
  for (const r of rows as any[]) {
    for (const k of Object.keys(r)) if (typeof r[k] === 'bigint') r[k] = Number(r[k]);
  }
  return rows;
}

export async function createPglite(dataDir?: string): Promise<Db> {
  const { PGlite } = await import('@electric-sql/pglite');
  if (dataDir) fs.mkdirSync(path.dirname(path.resolve(dataDir)), { recursive: true });
  const pgl = dataDir ? new PGlite(dataDir) : new PGlite();
  await pgl.waitReady;
  return {
    async query(sql, params) {
      return normalize((await pgl.query(sql, params as any[])).rows as any[]);
    },
    async exec(sql) {
      await pgl.exec(sql);
    },
    async tx(fn) {
      return pgl.transaction(async (t) =>
        fn({ query: async (s, p) => normalize((await t.query(s, p as any[])).rows as any[]) }),
      );
    },
    close: () => pgl.close(),
  };
}

export function migrationsDir() {
  return path.resolve(process.cwd(), 'supabase', 'migrations');
}

/** Применяет ещё не применённые файлы из supabase/migrations */
export async function applyMigrations(db: Db, dir = migrationsDir()): Promise<string[]> {
  await db.exec(
    'create table if not exists public.schema_migrations (name text primary key, applied_at timestamptz not null default now())',
  );
  const done = new Set((await db.query<{ name: string }>('select name from public.schema_migrations')).map((r) => r.name));
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  const applied: string[] = [];
  for (const f of files) {
    if (done.has(f)) continue;
    await db.exec(fs.readFileSync(path.join(dir, f), 'utf8'));
    await db.query('insert into public.schema_migrations (name) values ($1)', [f]);
    applied.push(f);
  }
  return applied;
}

import { getDb, type Queryable } from '../db';
import { getCourse } from './content';
import { ValidationError } from './admin';
import { mapProfile, PROFILE_COLS } from './users';
import type { Profile } from '../types';

/**
 * Админка → пользователи: список с фильтрами, карточка, действия с журналом.
 * Каждое изменяющее действие пишется в admin_audit_log в той же транзакции.
 */

const UUID = /^[0-9a-f-]{36}$/i;
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : ((v as string | null) ?? null));

export const USER_FILTERS = ['all', 'active', 'expiring', 'expired', 'never', 'paid', 'admin', 'blocked'] as const;
export type UserFilter = (typeof USER_FILTERS)[number];
export const USER_SORTS = ['created_at', 'last_seen_at', 'access_until', 'answers', 'name'] as const;
export type UserSort = (typeof USER_SORTS)[number];

export interface UserListOpts {
  q?: string;
  filter?: string;
  tag?: string;
  sort?: string;
  dir?: string;
  page?: number;
  perPage?: number;
}

const FILTER_SQL: Record<UserFilter, string> = {
  all: 'true',
  active: 'p.access_until > now()',
  expiring: `p.access_until > now() and p.access_until <= now() + interval '7 days'`,
  expired: 'p.access_until is not null and p.access_until <= now()',
  never: 'p.access_until is null',
  paid: `exists (select 1 from payments pay where pay.user_id = p.id)`,
  admin: 'p.is_admin',
  blocked: 'p.blocked_at is not null',
};

const SORT_SQL: Record<UserSort, string> = {
  created_at: 'p.created_at',
  last_seen_at: 'p.last_seen_at',
  access_until: 'p.access_until',
  answers: 'answers',
  name: `lower(coalesce(p.display_name, p.telegram_username, ''))`,
};

export interface AdminUserRow extends Profile {
  tags: string[];
  last_seen_at: string | null;
  answers: number;
  tests_passed: number;
  errors_open: number;
  payments_count: number;
}

function listWhere(o: UserListOpts) {
  const filter = (USER_FILTERS as readonly string[]).includes(o.filter ?? '') ? (o.filter as UserFilter) : 'all';
  const where: string[] = [FILTER_SQL[filter]];
  const params: unknown[] = [];
  const q = (o.q ?? '').trim();
  if (q) {
    params.push(`%${q.replace(/^@/, '')}%`);
    let cond = `coalesce(p.display_name,'') ilike $${params.length} or coalesce(p.telegram_username,'') ilike $${params.length} or p.telegram_id::text like $${params.length}`;
    if (UUID.test(q)) {
      params.push(q.toLowerCase());
      cond += ` or p.id::text = $${params.length}`;
    }
    where.push(`(${cond})`);
  }
  const tag = (o.tag ?? '').trim();
  if (tag) {
    params.push(tag);
    where.push(`$${params.length} = any(p.tags)`);
  }
  return { w: where.join(' and '), params };
}

export async function listUsersAdmin(o: UserListOpts = {}): Promise<{ rows: AdminUserRow[]; total: number; page: number; perPage: number }> {
  const db = await getDb();
  const { w, params } = listWhere(o);
  const sort = (USER_SORTS as readonly string[]).includes(o.sort ?? '') ? (o.sort as UserSort) : 'created_at';
  const dir = o.dir === 'asc' ? 'asc' : 'desc';
  const perPage = Math.min(Math.max(o.perPage ?? 50, 1), 500);
  const page = Math.max(o.page ?? 1, 1);
  const total = (await db.query<{ n: number }>(`select count(*)::int as n from profiles p where ${w}`, params))[0].n;
  const rows = await db.query(
    `select ${PROFILE_COLS.split(',').map((c) => 'p.' + c.trim()).join(', ')}, p.tags, p.last_seen_at,
            (select count(*)::int from answer_log a where a.user_id = p.id) as answers,
            (select count(*)::int from test_progress tp where tp.user_id = p.id and tp.passed) as tests_passed,
            (select count(*)::int from user_errors e where e.user_id = p.id and not e.resolved) as errors_open,
            (select count(*)::int from payments pay where pay.user_id = p.id) as payments_count
       from profiles p
      where ${w}
      order by ${SORT_SQL[sort]} ${dir} nulls last, p.created_at desc
      limit ${perPage} offset ${(page - 1) * perPage}`,
    params,
  );
  return {
    rows: rows.map((r: any) => ({ ...mapProfile(r), tags: r.tags ?? [], last_seen_at: iso(r.last_seen_at), answers: r.answers, tests_passed: r.tests_passed, errors_open: r.errors_open, payments_count: r.payments_count })),
    total,
    page,
    perPage,
  };
}

/** Все теги, которые уже используются (для подсказок и фильтра) */
export async function listAllTags(): Promise<{ tag: string; n: number }[]> {
  const db = await getDb();
  return db.query(`select t as tag, count(*)::int as n from profiles p, unnest(p.tags) as t group by t order by n desc, t`);
}

/** Плоская выгрузка для CSV (без пагинации, потолок 20 000) */
export async function exportUsers(o: UserListOpts = {}) {
  const r = await listUsersAdmin({ ...o, page: 1, perPage: 500 });
  const out: AdminUserRow[] = [...r.rows];
  for (let page = 2; out.length < r.total && page <= 40; page++) out.push(...(await listUsersAdmin({ ...o, page, perPage: 500 })).rows);
  return out;
}

// ------------------------------------------------------------------ карточка

export interface UserDetail {
  user: Profile & { tags: string[]; last_seen_at: string | null; blocked_reason: string | null };
  stats: { answers: number; correct: number; accuracy: number; tests_passed: number; errors_open: number; errors_pending: number; errors_resolved: number; first_answer_at: string | null; last_answer_at: string | null };
  daily: { d: string; n: number; ok: number }[];
  progress: { category: string; number: number; attempts: number; best_errors: number | null; last_errors: number | null; passed: boolean; last_attempt_at: string | null }[];
  payments: { id: string; ref: string; amount_cents: number; currency: string; days_granted: number; created_at: string; is_test: boolean | null }[];
  invoices: { inv_id: number; status: string; is_test: boolean; out_sum: number; shown_currency: string | null; shown_amount: number | null; created_at: string; paid_at: string | null }[];
  claims: { id: string; exam_date: string; result: string; days_added: number; revoked: boolean; created_at: string }[];
  notes: { id: number; author_name: string | null; body: string; created_at: string }[];
  audit: AuditRow[];
  checkpoints: { milestone: number; kind: 'mid' | 'final'; tests: number; status: 'locked' | 'available' | 'passed' }[];
  check_runs: { id: string; milestone: number; kind: string; status: string; by_admin: boolean; started_at: string; finished_at: string | null; results: { display: number; errors: number; total: number }[] | null }[];
  recent: { question_id: string; context: string; correct: boolean; chosen: string; created_at: string; topic: string | null }[];
}

export async function getUserDetail(id: string): Promise<UserDetail | null> {
  if (!UUID.test(id)) return null;
  const db = await getDb();
  const pr = (await db.query(`select ${PROFILE_COLS}, tags, last_seen_at, blocked_reason from profiles where id = $1`, [id]))[0];
  if (!pr) return null;
  const [st, daily, progress, payments, invoices, claims, notes, recent] = await Promise.all([
    db.query(
      `select count(*)::int as answers, count(*) filter (where correct)::int as correct, min(created_at) as first_at, max(created_at) as last_at
         from answer_log where user_id = $1`,
      [id],
    ),
    db.query(
      `select to_char(d::date, 'YYYY-MM-DD') as d, coalesce(a.n, 0)::int as n, coalesce(a.ok, 0)::int as ok
         from generate_series(current_date - 29, current_date, interval '1 day') d
         left join (select created_at::date as day, count(*) as n, count(*) filter (where correct) as ok from answer_log where user_id = $1 group by 1) a on a.day = d::date
        order by d`,
      [id],
    ),
    db.query(
      `select test_category as category, test_number as number, attempts, best_errors, last_errors, passed, last_attempt_at
         from test_progress where user_id = $1 order by last_attempt_at desc nulls last limit 200`,
      [id],
    ),
    db.query(
      `select p.id, p.stripe_session_id as ref, p.amount_cents, p.currency, p.days_granted, p.created_at, i.is_test
         from payments p left join robokassa_invoices i on p.stripe_session_id = 'rk:' || i.inv_id::text
        where p.user_id = $1 order by p.created_at desc`,
      [id],
    ),
    db.query(
      `select inv_id, status, is_test, out_sum::float8 as out_sum, shown_currency, shown_amount::float8 as shown_amount, created_at, paid_at
         from robokassa_invoices where user_id = $1 order by created_at desc limit 100`,
      [id],
    ),
    db.query(
      `select id, to_char(exam_date, 'YYYY-MM-DD') as exam_date, result, days_added, revoked, created_at from exam_claims where user_id = $1 order by created_at desc`,
      [id],
    ),
    db.query(`select id, author_name, body, created_at from user_notes where user_id = $1 order by created_at desc limit 200`, [id]),
    db.query(
      `select a.question_id, a.context, a.correct, a.chosen, a.created_at, qs.topic
         from answer_log a left join questions qs on qs.id = a.question_id
        where a.user_id = $1 order by a.created_at desc limit 30`,
      [id],
    ),
  ]);
  const errs = (
    await db.query(
      `select count(*) filter (where pending > 0)::int as open, coalesce(sum(pending), 0)::int as pending, count(*) filter (where pending = 0)::int as done from user_errors where user_id = $1`,
      [id],
    )
  )[0];
  const passed = (await db.query(`select count(*)::int as n from test_progress where user_id = $1 and passed`, [id]))[0].n;
  const s = st[0];
  return {
    user: { ...mapProfile(pr), tags: pr.tags ?? [], last_seen_at: iso(pr.last_seen_at), blocked_reason: pr.blocked_reason ?? null },
    stats: {
      answers: s.answers,
      correct: s.correct,
      accuracy: s.answers ? Math.round((s.correct / s.answers) * 100) : 0,
      tests_passed: passed,
      errors_open: errs.open,
      errors_pending: errs.pending,
      errors_resolved: errs.done,
      first_answer_at: iso(s.first_at),
      last_answer_at: iso(s.last_at),
    },
    daily,
    progress: progress.map((r: any) => ({ ...r, last_attempt_at: iso(r.last_attempt_at) })),
    payments: payments.map((r: any) => ({ ...r, created_at: iso(r.created_at) as string })),
    invoices: invoices.map((r: any) => ({ ...r, created_at: iso(r.created_at) as string, paid_at: iso(r.paid_at) })),
    claims: claims.map((r: any) => ({ ...r, created_at: iso(r.created_at) as string })),
    notes: notes.map((r: any) => ({ ...r, created_at: iso(r.created_at) as string })),
    audit: await listAudit({ user: id, perPage: 50 }).then((a) => a.rows),
    checkpoints: (await getCourse(id)).checkpoints,
    check_runs: (
      await db.query(
        `select id, milestone, kind, status, by_admin, started_at, finished_at, results from checkpoint_runs where user_id = $1 order by started_at desc limit 30`,
        [id],
      )
    ).map((r: any) => ({ ...r, started_at: iso(r.started_at) as string, finished_at: iso(r.finished_at), results: typeof r.results === 'string' ? JSON.parse(r.results) : r.results })),
    recent: recent.map((r: any) => ({ ...r, created_at: iso(r.created_at) as string })),
  };
}

// ------------------------------------------------------------------ журнал

export interface AuditRow {
  id: number;
  admin_id: string | null;
  admin_name: string | null;
  action: string;
  target_user_id: string | null;
  target_name: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export const AUDIT_ACTIONS: Record<string, string> = {
  grant_days: 'Выдача дней доступа',
  set_access_until: 'Установка даты доступа',
  end_access: 'Закрытие доступа',
  set_admin: 'Права администратора',
  block: 'Блокировка',
  unblock: 'Разблокировка',
  set_tags: 'Теги',
  note_add: 'Заметка добавлена',
  note_delete: 'Заметка удалена',
  checkpoint_clear: 'Проверка засчитана вручную',
  useful_save: '«Полезно»: материал сохранён',
  useful_delete: '«Полезно»: материал удалён',
  useful_section: '«Полезно»: разделы',
};

const nameOf = (p: { display_name: string | null; telegram_username: string | null; telegram_id: number }) =>
  p.display_name || (p.telegram_username ? `@${p.telegram_username}` : `id${p.telegram_id}`);

export async function writeAudit(q: Queryable, admin: Profile, action: string, target: { id: string; name: string } | null, details: Record<string, unknown> = {}) {
  await q.query(
    `insert into admin_audit_log (admin_id, admin_name, action, target_user_id, target_name, details) values ($1, $2, $3, $4, $5, $6::jsonb)`,
    [admin.id, nameOf(admin), action, target?.id ?? null, target?.name ?? null, JSON.stringify(details)],
  );
}

export async function listAudit(o: { action?: string; admin?: string; user?: string; page?: number; perPage?: number } = {}) {
  const db = await getDb();
  const where: string[] = [];
  const p: unknown[] = [];
  if (o.action && o.action in AUDIT_ACTIONS) { p.push(o.action); where.push(`action = $${p.length}`); }
  if (o.admin && UUID.test(o.admin)) { p.push(o.admin); where.push(`admin_id = $${p.length}`); }
  if (o.user && UUID.test(o.user)) { p.push(o.user); where.push(`target_user_id = $${p.length}`); }
  const w = where.length ? 'where ' + where.join(' and ') : '';
  const perPage = Math.min(Math.max(o.perPage ?? 50, 1), 200);
  const page = Math.max(o.page ?? 1, 1);
  const total = (await db.query<{ n: number }>(`select count(*)::int as n from admin_audit_log ${w}`, p))[0].n;
  const rows = await db.query(
    `select id, admin_id, admin_name, action, target_user_id, target_name, details, created_at from admin_audit_log ${w}
      order by created_at desc, id desc limit ${perPage} offset ${(page - 1) * perPage}`,
    p,
  );
  return { rows: rows.map((r: any) => ({ ...r, created_at: iso(r.created_at) as string })) as AuditRow[], total, page, perPage };
}

export async function listAuditAdmins(): Promise<{ id: string; name: string }[]> {
  const db = await getDb();
  return db.query(`select admin_id as id, max(admin_name) as name from admin_audit_log where admin_id is not null group by admin_id order by 2`);
}

// ------------------------------------------------------------------ действия

async function lockUser(q: Queryable, id: string) {
  if (!UUID.test(id)) throw new ValidationError('Неверный пользователь');
  const r = (await q.query(`select id, telegram_id, telegram_username, display_name, is_admin, access_until, blocked_at from profiles where id = $1 for update`, [id]))[0];
  if (!r) throw new ValidationError('Пользователь не найден');
  return r;
}

const cleanReason = (s: unknown) => String(s ?? '').trim().slice(0, 300);

export const MAX_GRANT_DAYS = 3650;

/** Выдать (или снять, если отрицательное) дни доступа. Возвращает новую дату и Telegram ID для уведомления. */
export async function adminGrantDays(admin: Profile, userId: string, days: number, reason?: string) {
  if (!Number.isInteger(days) || days === 0 || Math.abs(days) > MAX_GRANT_DAYS) throw new ValidationError(`Дней должно быть от −${MAX_GRANT_DAYS} до ${MAX_GRANT_DAYS}, не ноль`);
  const db = await getDb();
  return db.tx(async (q) => {
    const u = await lockUser(q, userId);
    const upd = (
      await q.query(
        `update profiles set access_until = greatest(coalesce(access_until, now()), now()) + make_interval(days => $2::int) where id = $1 returning access_until`,
        [userId, days],
      )
    )[0];
    // отрицательное число не должно уводить дату раньше «сейчас», если доступа и так не было — оставляем как есть
    const until = iso(upd.access_until) as string;
    await writeAudit(q, admin, 'grant_days', { id: userId, name: nameOf(u) }, { days, before: iso(u.access_until), after: until, reason: cleanReason(reason) });
    return { until, telegramId: Number(u.telegram_id) };
  });
}

/** Точная дата окончания доступа (включительно). date = 'YYYY-MM-DD' */
export async function adminSetAccessUntil(admin: Profile, userId: string, date: string, reason?: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) throw new ValidationError('Неверная дата');
  const y = Number(date.slice(0, 4));
  if (y < 2024 || y > 2100) throw new ValidationError('Дата вне допустимого диапазона');
  const db = await getDb();
  return db.tx(async (q) => {
    const u = await lockUser(q, userId);
    const upd = (
      await q.query(`update profiles set access_until = (($2::date + time '23:59:59')::timestamp at time zone 'UTC') where id = $1 returning access_until`, [userId, date])
    )[0];
    const until = iso(upd.access_until) as string;
    await writeAudit(q, admin, 'set_access_until', { id: userId, name: nameOf(u) }, { before: iso(u.access_until), after: until, reason: cleanReason(reason) });
    return { until, telegramId: Number(u.telegram_id) };
  });
}

/** Закрыть доступ прямо сейчас (дата остаётся в прошлом — видно, что доступ был) */
export async function adminEndAccess(admin: Profile, userId: string, reason?: string) {
  const db = await getDb();
  await db.tx(async (q) => {
    const u = await lockUser(q, userId);
    await q.query(`update profiles set access_until = now() where id = $1 and access_until > now()`, [userId]);
    await writeAudit(q, admin, 'end_access', { id: userId, name: nameOf(u) }, { before: iso(u.access_until), reason: cleanReason(reason) });
  });
}

export async function adminSetAdmin(admin: Profile, userId: string, on: boolean) {
  if (userId === admin.id && !on) throw new ValidationError('Нельзя снять права администратора с самого себя');
  const db = await getDb();
  await db.tx(async (q) => {
    const u = await lockUser(q, userId);
    if (!on && u.is_admin) {
      const left = (await q.query<{ n: number }>(`select count(*)::int as n from profiles where is_admin and id <> $1 and blocked_at is null`, [userId]))[0].n;
      if (left === 0) throw new ValidationError('Должен остаться хотя бы один администратор');
    }
    await q.query('update profiles set is_admin = $2 where id = $1', [userId, on]);
    await writeAudit(q, admin, 'set_admin', { id: userId, name: nameOf(u) }, { on });
  });
}

export async function adminBlock(admin: Profile, userId: string, on: boolean, reason?: string) {
  if (on && userId === admin.id) throw new ValidationError('Нельзя заблокировать самого себя');
  const db = await getDb();
  await db.tx(async (q) => {
    const u = await lockUser(q, userId);
    if (on && u.is_admin) throw new ValidationError('Сначала снимите с пользователя права администратора');
    await q.query(
      `update profiles set blocked_at = case when $2::boolean then now() else null end, blocked_reason = case when $2::boolean then $3 else null end where id = $1`,
      [userId, on, on ? cleanReason(reason) || null : null],
    );
    await writeAudit(q, admin, on ? 'block' : 'unblock', { id: userId, name: nameOf(u) }, { reason: cleanReason(reason) });
  });
}

export function normalizeTags(input: unknown): string[] {
  const raw = Array.isArray(input) ? input : String(input ?? '').split(',');
  const seen = new Set<string>();
  for (const t of raw) {
    const s = String(t).trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 30);
    if (s) seen.add(s);
  }
  if (seen.size > 20) throw new ValidationError('Не больше 20 тегов');
  return [...seen];
}

export async function adminSetTags(admin: Profile, userId: string, tags: unknown) {
  const clean = normalizeTags(tags);
  const db = await getDb();
  await db.tx(async (q) => {
    const u = await lockUser(q, userId);
    await q.query('update profiles set tags = $2::text[] where id = $1', [userId, clean]);
    await writeAudit(q, admin, 'set_tags', { id: userId, name: nameOf(u) }, { tags: clean });
  });
  return clean;
}

export async function adminAddNote(admin: Profile, userId: string, body: unknown) {
  const text = String(body ?? '').trim();
  if (!text) throw new ValidationError('Пустая заметка');
  if (text.length > 2000) throw new ValidationError('Заметка длиннее 2000 символов');
  const db = await getDb();
  await db.tx(async (q) => {
    const u = await lockUser(q, userId);
    await q.query('insert into user_notes (user_id, author_id, author_name, body) values ($1, $2, $3, $4)', [userId, admin.id, nameOf(admin), text]);
    await writeAudit(q, admin, 'note_add', { id: userId, name: nameOf(u) }, { preview: text.slice(0, 80) });
  });
}

export async function adminDeleteNote(admin: Profile, userId: string, noteId: number) {
  if (!Number.isInteger(noteId) || noteId < 1) throw new ValidationError('Неверная заметка');
  const db = await getDb();
  await db.tx(async (q) => {
    const u = await lockUser(q, userId);
    const r = await q.query('delete from user_notes where id = $1 and user_id = $2 returning id', [noteId, userId]);
    if (r.length) await writeAudit(q, admin, 'note_delete', { id: userId, name: nameOf(u) }, { noteId });
  });
}

/** Засчитывает проверку (закрепление) вручную — например, если пользователь застрял. Следующий тест откроется. */
export async function adminClearCheckpoint(admin: Profile, userId: string, milestone: number) {
  if (!UUID.test(userId)) throw new ValidationError('Пользователь не найден');
  const db = await getDb();
  return db.tx(async (q) => {
    const u = (await q.query(`select ${PROFILE_COLS} from profiles where id = $1`, [userId]))[0];
    if (!u) throw new ValidationError('Пользователь не найден');
    const cp = (await getCourse(userId, q)).checkpoints.find((c) => c.milestone === milestone);
    if (!cp) throw new ValidationError('Такой проверки нет в курсе');
    if (cp.status === 'passed') throw new ValidationError('Проверка уже сдана');
    await q.query(
      `insert into checkpoint_runs (user_id, kind, milestone, tests, status, by_admin, finished_at) values ($1, $2, $3, '[]'::jsonb, 'passed', true, now())`,
      [userId, cp.kind, milestone],
    );
    await writeAudit(q, admin, 'checkpoint_clear', { id: userId, name: nameOf(u) }, { milestone, kind: cp.kind });
  });
}

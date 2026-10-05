import { getDb, type Queryable } from '../db';
import type { Profile } from '../types';
import { ValidationError } from './admin';
import { writeAudit } from './admin-users';
import { cleanBlocksI18n, cleanI18n, LIMITS, pickBlocks, pickText, SLUG_RE, slugify, type Block, type ULang } from '../useful';

/** «Полезно»: инструкции и материалы. Пользователи читают опубликованное, админ редактирует (/admin/useful). */

type I18n = Record<ULang, string>;
const UUID = /^[0-9a-f-]{36}$/i;
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : ((v as string | null) ?? null));
const obj = <T,>(v: unknown, fallback: T): T => (typeof v === 'string' ? JSON.parse(v) : (v as T)) ?? fallback;

// ---------------------------------------------------------------- для пользователей

export interface UsefulCard {
  slug: string;
  icon: string | null;
  title: string;
  summary: string;
}
export interface UsefulGroup {
  id: string | null;
  title: string | null;
  pages: UsefulCard[];
}

/** Опубликованные материалы, сгруппированные по разделам (разделы по порядку, без раздела — в конце) */
export async function listPublicUseful(lang: ULang): Promise<UsefulGroup[]> {
  const db = await getDb();
  const sections = await db.query(`select id, title from useful_sections order by sort, created_at`);
  const pages = await db.query(
    `select slug, icon, title, summary, section_id from useful_pages where status = 'published' order by sort, created_at`,
  );
  const card = (p: any): UsefulCard => ({
    slug: p.slug,
    icon: p.icon,
    title: pickText(obj<I18n>(p.title, {} as I18n), lang),
    summary: pickText(obj<I18n>(p.summary, {} as I18n), lang),
  });
  const groups: UsefulGroup[] = sections.map((s: any) => ({
    id: s.id,
    title: pickText(obj<I18n>(s.title, {} as I18n), lang) || null,
    pages: pages.filter((p: any) => p.section_id === s.id).map(card),
  }));
  const loose = pages.filter((p: any) => !p.section_id || !sections.some((s: any) => s.id === p.section_id)).map(card);
  if (loose.length) groups.push({ id: null, title: null, pages: loose });
  return groups.filter((g) => g.pages.length);
}

export interface PublicPage {
  slug: string;
  icon: string | null;
  title: string;
  summary: string;
  blocks: Block[];
  section: string | null;
  updated_at: string;
}

export async function getPublicPage(slug: string, lang: ULang): Promise<PublicPage | null> {
  if (!SLUG_RE.test(slug)) return null;
  const db = await getDb();
  const r = (
    await db.query(
      `select p.slug, p.icon, p.title, p.summary, p.blocks, p.updated_at, s.title as section_title
         from useful_pages p left join useful_sections s on s.id = p.section_id
        where p.slug = $1 and p.status = 'published'`,
      [slug],
    )
  )[0];
  if (!r) return null;
  return {
    slug: r.slug,
    icon: r.icon,
    title: pickText(obj<I18n>(r.title, {} as I18n), lang),
    summary: pickText(obj<I18n>(r.summary, {} as I18n), lang),
    blocks: pickBlocks(obj(r.blocks, {}), lang),
    section: r.section_title ? pickText(obj<I18n>(r.section_title, {} as I18n), lang) || null : null,
    updated_at: iso(r.updated_at) as string,
  };
}

// ---------------------------------------------------------------- для админки

export interface AdminSection {
  id: string;
  title: I18n;
  sort: number;
  pages: number;
}
export interface AdminPageRow {
  id: string;
  slug: string;
  icon: string | null;
  status: 'draft' | 'published';
  sort: number;
  section_id: string | null;
  section_title: string | null;
  title: I18n;
  has_hy: boolean;
  updated_at: string;
  published_at: string | null;
}
export interface AdminPage extends Omit<AdminPageRow, 'section_title' | 'has_hy'> {
  summary: I18n;
  blocks: Record<ULang, Block[]>;
}

export async function listUsefulAdmin(): Promise<{ sections: AdminSection[]; pages: AdminPageRow[] }> {
  const db = await getDb();
  const sections = await db.query(
    `select s.id, s.title, s.sort, (select count(*)::int from useful_pages p where p.section_id = s.id) as pages
       from useful_sections s order by s.sort, s.created_at`,
  );
  const pages = await db.query(
    `select p.id, p.slug, p.icon, p.status, p.sort, p.section_id, p.title, p.blocks, p.updated_at, p.published_at, s.title as section_title
       from useful_pages p left join useful_sections s on s.id = p.section_id
      order by p.sort, p.created_at`,
  );
  return {
    sections: sections.map((s: any) => ({ id: s.id, title: obj<I18n>(s.title, { ru: '', hy: '' }), sort: s.sort, pages: s.pages })),
    pages: pages.map((p: any) => {
      const blocks = obj<Record<string, unknown[]>>(p.blocks, {});
      const title = obj<I18n>(p.title, { ru: '', hy: '' });
      return {
        id: p.id, slug: p.slug, icon: p.icon, status: p.status, sort: p.sort, section_id: p.section_id,
        section_title: p.section_title ? pickText(obj<I18n>(p.section_title, {} as I18n), 'ru') : null,
        title, has_hy: !!(title.hy || (blocks.hy && blocks.hy.length)),
        updated_at: iso(p.updated_at) as string, published_at: iso(p.published_at),
      };
    }),
  };
}

export async function getUsefulPage(id: string): Promise<AdminPage | null> {
  if (!UUID.test(id)) return null;
  const db = await getDb();
  const p = (await db.query(`select * from useful_pages where id = $1`, [id]))[0];
  if (!p) return null;
  const blocks = cleanBlocksI18n(obj(p.blocks, {}));
  return {
    id: p.id, slug: p.slug, icon: p.icon, status: p.status, sort: p.sort, section_id: p.section_id,
    title: { ru: '', hy: '', ...obj<Partial<I18n>>(p.title, {}) } as I18n,
    summary: { ru: '', hy: '', ...obj<Partial<I18n>>(p.summary, {}) } as I18n,
    blocks, updated_at: iso(p.updated_at) as string, published_at: iso(p.published_at),
  };
}

export interface UsefulInput {
  id?: string;
  slug?: string;
  icon?: string | null;
  status?: string;
  section_id?: string | null;
  title?: unknown;
  summary?: unknown;
  blocks?: unknown;
}

/** Создаёт или обновляет материал. Всё из админки проходит очистку (lib/useful.ts). */
export async function saveUsefulPage(admin: Profile, input: UsefulInput): Promise<{ id: string; slug: string }> {
  const title = cleanI18n(input.title, LIMITS.title);
  const summary = cleanI18n(input.summary, LIMITS.summary);
  const blocks = cleanBlocksI18n(input.blocks);
  if (!title.ru) throw new ValidationError('Укажите заголовок (русский)');
  if (!blocks.ru.length && blocks.hy.length) throw new ValidationError('Сначала заполните русскую версию: армянская показывается, только если русская есть');
  const status = input.status === 'published' ? 'published' : 'draft';
  const icon = typeof input.icon === 'string' && input.icon.trim() ? Array.from(input.icon.trim()).slice(0, 4).join('') : null;
  const db = await getDb();
  return db.tx(async (q) => {
    let sectionId: string | null = null;
    if (input.section_id) {
      if (!UUID.test(input.section_id) || !(await q.query('select 1 from useful_sections where id = $1', [input.section_id])).length) {
        throw new ValidationError('Раздел не найден');
      }
      sectionId = input.section_id;
    }
    let slug = (input.slug ?? '').trim().toLowerCase();
    if (slug && !SLUG_RE.test(slug)) throw new ValidationError('Адрес страницы: латиница, цифры и дефисы, например «medspravka»');
    if (!slug) slug = slugify(title.ru);

    if (input.id) {
      if (!UUID.test(input.id)) throw new ValidationError('Материал не найден');
      const cur = (await q.query('select slug, status from useful_pages where id = $1 for update', [input.id]))[0];
      if (!cur) throw new ValidationError('Материал не найден');
      if (!input.slug) slug = cur.slug; // адрес не меняем без явной просьбы — ссылки на страницу не ломаются
      await ensureSlugFree(q, slug, input.id);
      await q.query(
        `update useful_pages set slug = $2, icon = $3, status = $4, section_id = $5, title = $6::jsonb, summary = $7::jsonb, blocks = $8::jsonb,
                updated_at = now(), published_at = case when $4 = 'published' then coalesce(published_at, now()) else published_at end
          where id = $1`,
        [input.id, slug, icon, status, sectionId, JSON.stringify(title), JSON.stringify(summary), JSON.stringify(blocks)],
      );
      await writeAudit(q, admin, 'useful_save', null, { id: input.id, slug, title: title.ru, status, was: cur.status });
      return { id: input.id, slug };
    }
    slug = await uniqueSlug(q, slug);
    const next = (await q.query('select coalesce(max(sort), 0) + 10 as n from useful_pages where section_id is not distinct from $1', [sectionId]))[0].n;
    const r = await q.query(
      `insert into useful_pages (slug, icon, status, section_id, sort, title, summary, blocks, published_at)
       values ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, case when $3 = 'published' then now() end) returning id`,
      [slug, icon, status, sectionId, next, JSON.stringify(title), JSON.stringify(summary), JSON.stringify(blocks)],
    );
    await writeAudit(q, admin, 'useful_save', null, { id: r[0].id, slug, title: title.ru, status, created: true });
    return { id: r[0].id, slug };
  });
}

async function ensureSlugFree(q: Queryable, slug: string, exceptId: string) {
  if ((await q.query('select 1 from useful_pages where slug = $1 and id <> $2', [slug, exceptId])).length) {
    throw new ValidationError(`Адрес «${slug}» уже занят другим материалом`);
  }
}

async function uniqueSlug(q: Queryable, base: string): Promise<string> {
  let slug = base;
  for (let i = 2; (await q.query('select 1 from useful_pages where slug = $1', [slug])).length; i++) slug = `${base.slice(0, 55)}-${i}`;
  return slug;
}

export async function deleteUsefulPage(admin: Profile, id: string): Promise<void> {
  if (!UUID.test(id)) throw new ValidationError('Материал не найден');
  const db = await getDb();
  await db.tx(async (q) => {
    const r = await q.query('delete from useful_pages where id = $1 returning slug, title', [id]);
    if (!r.length) throw new ValidationError('Материал не найден');
    await writeAudit(q, admin, 'useful_delete', null, { id, slug: r[0].slug, title: obj<I18n>(r[0].title, {} as I18n).ru });
  });
}

/** Сдвиг материала вверх/вниз внутри его раздела */
export async function moveUsefulPage(admin: Profile, id: string, dir: 'up' | 'down'): Promise<void> {
  if (!UUID.test(id)) throw new ValidationError('Материал не найден');
  const db = await getDb();
  await db.tx(async (q) => {
    const cur = (await q.query('select section_id from useful_pages where id = $1', [id]))[0];
    if (!cur) throw new ValidationError('Материал не найден');
    const list = await q.query<{ id: string }>(
      'select id from useful_pages where section_id is not distinct from $1 order by sort, created_at, id',
      [cur.section_id],
    );
    const i = list.findIndex((x) => x.id === id);
    const j = dir === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    for (let k = 0; k < list.length; k++) await q.query('update useful_pages set sort = $2 where id = $1', [list[k].id, (k + 1) * 10]);
  });
}

// ---------------------------------------------------------------- разделы

export async function saveUsefulSection(admin: Profile, input: { id?: string; title?: unknown }): Promise<string> {
  const title = cleanI18n(input.title, 80);
  if (!title.ru) throw new ValidationError('Название раздела (русский) обязательно');
  const db = await getDb();
  return db.tx(async (q) => {
    let id = input.id;
    if (id) {
      if (!UUID.test(id)) throw new ValidationError('Раздел не найден');
      const r = await q.query('update useful_sections set title = $2::jsonb where id = $1 returning id', [id, JSON.stringify(title)]);
      if (!r.length) throw new ValidationError('Раздел не найден');
    } else {
      const next = (await q.query('select coalesce(max(sort), 0) + 10 as n from useful_sections'))[0].n;
      id = (await q.query('insert into useful_sections (title, sort) values ($1::jsonb, $2) returning id', [JSON.stringify(title), next]))[0].id as string;
    }
    await writeAudit(q, admin, 'useful_section', null, { action: input.id ? 'rename' : 'create', title: title.ru });
    return id!;
  });
}

/** Удаление раздела: материалы остаются, просто без раздела */
export async function deleteUsefulSection(admin: Profile, id: string): Promise<void> {
  if (!UUID.test(id)) throw new ValidationError('Раздел не найден');
  const db = await getDb();
  await db.tx(async (q) => {
    const r = await q.query('delete from useful_sections where id = $1 returning title', [id]);
    if (!r.length) throw new ValidationError('Раздел не найден');
    await writeAudit(q, admin, 'useful_section', null, { action: 'delete', title: obj<I18n>(r[0].title, {} as I18n).ru });
  });
}

export async function moveUsefulSection(admin: Profile, id: string, dir: 'up' | 'down'): Promise<void> {
  if (!UUID.test(id)) throw new ValidationError('Раздел не найден');
  const db = await getDb();
  await db.tx(async (q) => {
    const list = await q.query<{ id: string }>('select id from useful_sections order by sort, created_at, id');
    const i = list.findIndex((x) => x.id === id);
    if (i < 0) throw new ValidationError('Раздел не найден');
    const j = dir === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    for (let k = 0; k < list.length; k++) await q.query('update useful_sections set sort = $2 where id = $1', [list[k].id, (k + 1) * 10]);
  });
}


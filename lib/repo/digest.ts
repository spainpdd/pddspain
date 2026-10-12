import { getDb } from '../db';
import type { Profile } from '../types';
import { PROFILE_COLS, mapProfile } from './users';
import { pickText, type ULang } from '../useful';

/** Рассылка материалов «Полезно» в бот: кому слать и что */

export const DIGEST_INACTIVE_DAYS = 2;
export const DIGEST_MIN_GAP_DAYS = 3;

export interface DigestPage {
  id: string;
  slug: string;
  icon: string | null;
  title: Record<string, string>;
  summary: Record<string, string>;
}

const obj = <T,>(v: unknown, fallback: T): T => (typeof v === 'string' ? JSON.parse(v) : (v as T)) ?? fallback;

/** Опубликованные материалы в порядке показа в приложении (разделы по порядку, внутри — по порядку страниц) */
export async function listDigestPages(): Promise<DigestPage[]> {
  const db = await getDb();
  const rows = await db.query(
    `select p.id, p.slug, p.icon, p.title, p.summary
       from useful_pages p left join useful_sections s on s.id = p.section_id
      where p.status = 'published'
      order by coalesce(s.sort, 2147483647), p.sort, p.created_at`,
  );
  return rows.map((r: any) => ({ id: r.id, slug: r.slug, icon: r.icon, title: obj(r.title, {}), summary: obj(r.summary, {}) }));
}

/**
 * Кому слать: подписаны на бота, не заблокированы, последняя активность (вход или ответ на вопрос) была
 * больше DIGEST_INACTIVE_DAYS дней назад и за последние DIGEST_MIN_GAP_DAYS дней материал им не присылали.
 */
export async function listDigestRecipients(): Promise<Profile[]> {
  const db = await getDb();
  const rows = await db.query(
    `select ${PROFILE_COLS.split(',').map((c) => 'p.' + c.trim()).join(', ')}
       from profiles p
      where p.notify and p.blocked_at is null
        and greatest(p.last_seen_at, coalesce((select max(a.created_at) from answer_log a where a.user_id = p.id), p.last_seen_at))
              < now() - make_interval(days => $1::int)
        and not exists (select 1 from useful_digest_log d where d.user_id = p.id and d.sent_at > now() - make_interval(days => $2::int))
      order by p.created_at`,
    [DIGEST_INACTIVE_DAYS, DIGEST_MIN_GAP_DAYS],
  );
  return rows.map(mapProfile);
}

/** Материалы, которые пользователю уже присылали */
export async function sentPageIds(userId: string): Promise<Set<string>> {
  const db = await getDb();
  const rows = await db.query<{ page_id: string }>('select page_id from useful_digest_log where user_id = $1', [userId]);
  return new Set(rows.map((r) => r.page_id));
}

export async function logDigest(userId: string, pageId: string) {
  const db = await getDb();
  await db.query('insert into useful_digest_log (user_id, page_id) values ($1, $2) on conflict (user_id, page_id) do update set sent_at = now()', [userId, pageId]);
}

export const digestTitle = (p: DigestPage, lang: ULang) => pickText(p.title, lang);
export const digestSummary = (p: DigestPage, lang: ULang) => pickText(p.summary, lang);

import { getDb, type Queryable } from '../db';
import { env } from '../env';
import type { Profile, StudyLang, TransLang } from '../types';

export const PROFILE_COLS = `id, telegram_id, telegram_username, display_name, photo_url, study_lang, trans_lang,
  auto_translate, notify, is_admin, access_until, guarantee_eligible, exam_passed_at, created_at, blocked_at`;

const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : ((v as string | null) ?? null));

export function mapProfile(r: any): Profile {
  return {
    ...r,
    access_until: iso(r.access_until),
    exam_passed_at: iso(r.exam_passed_at),
    created_at: iso(r.created_at) as string,
    blocked_at: iso(r.blocked_at),
  };
}

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export async function upsertTelegramUser(u: TelegramUser): Promise<Profile> {
  const db = await getDb();
  const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || `id${u.id}`;
  const isAdmin = env.adminTelegramIds.includes(u.id);
  const rows = await db.query(
    `insert into profiles (telegram_id, telegram_username, display_name, photo_url, is_admin)
     values ($1, $2, $3, $4, $5)
     on conflict (telegram_id) do update set
       telegram_username = excluded.telegram_username,
       display_name      = excluded.display_name,
       photo_url         = excluded.photo_url,
       is_admin          = profiles.is_admin or excluded.is_admin,
       last_seen_at      = now()
     returning ${PROFILE_COLS}`,
    [u.id, u.username ?? null, name, u.photo_url ?? null, isAdmin],
  );
  return mapProfile(rows[0]);
}

export async function getProfile(id: string): Promise<Profile | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const db = await getDb();
  const rows = await db.query(`select ${PROFILE_COLS} from profiles where id = $1`, [id]);
  return rows[0] ? mapProfile(rows[0]) : null;
}

export async function getProfileByTelegramId(tid: number): Promise<Profile | null> {
  const db = await getDb();
  const rows = await db.query(`select ${PROFILE_COLS} from profiles where telegram_id = $1`, [tid]);
  return rows[0] ? mapProfile(rows[0]) : null;
}

export async function updateSettings(
  id: string,
  s: { study_lang?: StudyLang; trans_lang?: TransLang; auto_translate?: boolean; notify?: boolean },
): Promise<Profile | null> {
  const db = await getDb();
  const rows = await db.query(
    `update profiles set
       study_lang     = coalesce($2, study_lang),
       trans_lang     = coalesce($3, trans_lang),
       auto_translate = coalesce($4, auto_translate),
       notify         = coalesce($5, notify)
     where id = $1 returning ${PROFILE_COLS}`,
    [id, s.study_lang ?? null, s.trans_lang ?? null, s.auto_translate ?? null, s.notify ?? null],
  );
  return rows[0] ? mapProfile(rows[0]) : null;
}

export interface DayActivity {
  date: string; // YYYY-MM-DD (Europe/Madrid)
  count: number;
}

export interface Stats {
  total_answers: number;
  total_correct: number;
  today_answers: number;
  today_correct: number;
  errors_open: number;
  errors_resolved: number;
  distinct_questions: number;
  accuracy: number; // % за всё время
  accuracy_last30: number; // % за последние 30 ответов
  streak_days: number; // дней подряд с хотя бы одним ответом, включая сегодня
  activity_14: DayActivity[]; // 14 дней, от старых к новым
}

const TODAY_START = `(date_trunc('day', now() at time zone 'Europe/Madrid') at time zone 'Europe/Madrid')`;

export async function getStats(userId: string, q?: Queryable): Promise<Stats> {
  const db = q ?? (await getDb());
  const [base, last30rows, dayRows] = await Promise.all([
    db.query(
      `select
         (select count(*)::int from answer_log where user_id = $1)                                  as total_answers,
         (select count(*)::int from answer_log where user_id = $1 and correct)                      as total_correct,
         (select count(*)::int from answer_log where user_id = $1 and created_at >= ${TODAY_START}) as today_answers,
         (select count(*)::int from answer_log where user_id = $1 and correct
                                                and created_at >= ${TODAY_START})                   as today_correct,
         (select count(distinct question_id)::int from answer_log where user_id = $1)                as distinct_questions,
         (select count(*)::int from user_errors where user_id = $1 and not resolved)                as errors_open,
         (select count(*)::int from user_errors where user_id = $1 and resolved)                    as errors_resolved`,
      [userId],
    ),
    db.query<{ correct: boolean }>(
      `select correct from answer_log where user_id = $1 order by created_at desc limit 30`,
      [userId],
    ),
    db.query<{ day: string; n: number }>(
      `select to_char(date_trunc('day', created_at at time zone 'Europe/Madrid'), 'YYYY-MM-DD') as day, count(*)::int as n
         from answer_log
        where user_id = $1 and created_at >= now() - interval '60 days'
        group by 1`,
      [userId],
    ),
  ]);
  const r = base[0];

  const accuracy_last30 = last30rows.length ? Math.round((last30rows.filter((x) => x.correct).length / last30rows.length) * 100) : 0;

  const byDay = new Map(dayRows.map((d) => [d.day, d.n]));
  const dayKey = (offset: number) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - offset);
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(d);
  };
  let streak_days = 0;
  for (let i = 0; i < 60; i++) {
    if ((byDay.get(dayKey(i)) ?? 0) > 0) streak_days++;
    else break;
  }
  const activity_14: DayActivity[] = Array.from({ length: 14 }, (_, i) => {
    const date = dayKey(13 - i);
    return { date, count: byDay.get(date) ?? 0 };
  });

  return {
    ...r,
    accuracy: r.total_answers ? Math.round((r.total_correct / r.total_answers) * 100) : 0,
    accuracy_last30,
    streak_days,
    activity_14,
  };
}

/** Одна-две вспомогательные выборки для бота/админки */
export async function listNotifiable(): Promise<Profile[]> {
  const db = await getDb();
  const rows = await db.query(`select ${PROFILE_COLS} from profiles where notify and blocked_at is null order by created_at`);
  return rows.map(mapProfile);
}

export async function setNotify(userId: string, notify: boolean) {
  const db = await getDb();
  await db.query('update profiles set notify = $2 where id = $1', [userId, notify]);
}

export async function countOpenErrors(userId: string): Promise<number> {
  const db = await getDb();
  return (await db.query('select count(*)::int as n from user_errors where user_id = $1 and not resolved', [userId]))[0].n;
}

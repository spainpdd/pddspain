import { getDb } from '../db';
import type { Profile } from '../types';
import { isReportReason, REPORT_COMMENT_MAX, REPORTS_PER_DAY } from '../reports';
import { ValidationError } from './admin';
import { RuleError } from './progress';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : ((v as string | null) ?? null));

/** Сообщение пользователя о проблеме с вопросом. Повтор той же жалобы обновляет комментарий. */
export async function createReport(
  userId: string,
  input: { questionId: unknown; reason: unknown; comment?: unknown; lang?: unknown },
): Promise<void> {
  if (typeof input.questionId !== 'string' || !UUID.test(input.questionId)) throw new RuleError('bad_question');
  if (!isReportReason(input.reason)) throw new RuleError('bad_reason');
  const comment = typeof input.comment === 'string' ? input.comment.replace(/\r\n/g, '\n').trim().slice(0, REPORT_COMMENT_MAX) : '';
  if (input.reason === 'other' && !comment) throw new RuleError('comment_required');
  const lang = typeof input.lang === 'string' && /^[a-z]{2}$/.test(input.lang) ? input.lang : null;

  const db = await getDb();
  await db.tx(async (q) => {
    if (!(await q.query('select 1 from questions where id = $1', [input.questionId])).length) throw new RuleError('bad_question');
    const today = (
      await q.query<{ n: number }>(`select count(*)::int as n from question_reports where user_id = $1 and created_at > now() - interval '1 day'`, [userId])
    )[0].n;
    if (today >= REPORTS_PER_DAY) throw new RuleError('too_many');
    await q.query(
      `insert into question_reports (user_id, question_id, reason, comment, lang) values ($1, $2, $3, $4, $5)
       on conflict (user_id, question_id, reason) where status = 'new' do update set comment = excluded.comment, lang = excluded.lang`,
      [userId, input.questionId, input.reason, comment, lang],
    );
  });
}

export async function countNewReports(): Promise<number> {
  const db = await getDb();
  return (await db.query<{ n: number }>(`select count(*)::int as n from question_reports where status = 'new'`))[0].n;
}

export interface ReportRow {
  id: string;
  user_id: string;
  user_name: string | null;
  telegram_username: string | null;
  question_id: string;
  question_text: string | null;
  reason: string;
  comment: string;
  lang: string | null;
  status: 'new' | 'resolved';
  admin_note: string | null;
  resolved_at: string | null;
  created_at: string;
  same_question: number; // сколько всего сообщений по этому вопросу
}

export async function listReports(o: { status?: string; reason?: string; page?: number; perPage?: number } = {}) {
  const db = await getDb();
  const where: string[] = [];
  const p: unknown[] = [];
  if (o.status === 'new' || o.status === 'resolved') { p.push(o.status); where.push(`r.status = $${p.length}`); }
  if (o.reason && isReportReason(o.reason)) { p.push(o.reason); where.push(`r.reason = $${p.length}`); }
  const w = where.length ? 'where ' + where.join(' and ') : '';
  const perPage = Math.min(Math.max(o.perPage ?? 30, 1), 100);
  const page = Math.max(o.page ?? 1, 1);
  const total = (await db.query<{ n: number }>(`select count(*)::int as n from question_reports r ${w}`, p))[0].n;
  const rows = await db.query(
    `select r.id, r.user_id, u.display_name as user_name, u.telegram_username, r.question_id,
            coalesce((select text from question_translations t where t.question_id = r.question_id and t.lang = 'ru'),
                     (select text from question_translations t where t.question_id = r.question_id and t.lang = 'es')) as question_text,
            r.reason, r.comment, r.lang, r.status, r.admin_note, r.resolved_at, r.created_at,
            (select count(*)::int from question_reports x where x.question_id = r.question_id) as same_question
       from question_reports r join profiles u on u.id = r.user_id
       ${w}
      order by (r.status = 'new') desc, r.created_at desc
      limit ${perPage} offset ${(page - 1) * perPage}`,
    p,
  );
  return {
    rows: rows.map((r: any) => ({ ...r, created_at: iso(r.created_at) as string, resolved_at: iso(r.resolved_at) })) as ReportRow[],
    total,
    page,
    perPage,
  };
}

/** Отметить сообщение обработанным (или вернуть в новые); можно оставить пометку для себя */
export async function setReportStatus(admin: Profile, id: string, status: 'new' | 'resolved', note?: unknown) {
  if (!UUID.test(id)) throw new ValidationError('Сообщение не найдено');
  const adminNote = typeof note === 'string' ? note.trim().slice(0, 500) : null;
  const db = await getDb();
  const r = await db.query(
    `update question_reports
        set status = $2, admin_note = coalesce($3, admin_note),
            resolved_by = case when $2 = 'resolved' then $4::uuid else null end,
            resolved_at = case when $2 = 'resolved' then now() else null end
      where id = $1 returning id`,
    [id, status, adminNote, admin.id],
  );
  if (!r.length) throw new ValidationError('Сообщение не найдено');
}

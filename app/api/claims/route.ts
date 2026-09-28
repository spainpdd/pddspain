import { apiUser, fail, json, readJson } from '@/lib/api';
import { createClaim } from '@/lib/repo/billing';

export const dynamic = 'force-dynamic';

/** Заявка по гарантии: «не сдал» продлевает доступ, «сдал» закрывает гарантию */
export async function POST(req: Request) {
  const a = await apiUser({ mutating: true });
  if ('res' in a) return a.res;
  const b = await readJson(req);
  if (!b || !['failed', 'passed'].includes(b.result) || typeof b.exam_date !== 'string') return fail(400, 'bad_request');
  const r = await createClaim(a.user.id, b.exam_date, b.result);
  if (!r.ok) return fail(422, r.reason);
  return json({ ok: true, addedDays: r.addDays, passed: r.markPassed });
}

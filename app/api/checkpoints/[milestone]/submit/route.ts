import { apiUser, fail, json, readJson } from '@/lib/api';
import { accessInfo } from '@/lib/auth';
import { canOpenCheckpoint } from '@/lib/engine';
import { RuleError } from '@/lib/repo/progress';
import { submitCheckpoint } from '@/lib/repo/checkpoints';

export const dynamic = 'force-dynamic';

/** Итог проверки: { runId, answers: { 'official:3': { questionId: 'a' } } } */
export async function POST(req: Request, { params }: { params: { milestone: string } }) {
  const a = await apiUser({ mutating: true });
  if ('res' in a) return a.res;
  const milestone = Number(params.milestone);
  if (!Number.isInteger(milestone) || milestone < 1) return fail(404, 'no_such_check');
  const acc = await accessInfo(a.user);
  if (!canOpenCheckpoint(milestone, acc.paid)) return fail(402, 'payment_required');
  const body = await readJson(req);
  if (!body || typeof body.runId !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.runId)) return fail(400, 'bad_request');
  try {
    return json(await submitCheckpoint(a.user.id, milestone, body.runId, body.answers));
  } catch (e) {
    if (e instanceof RuleError) return fail(e.code === 'no_active_run' ? 409 : 400, e.code);
    throw e;
  }
}

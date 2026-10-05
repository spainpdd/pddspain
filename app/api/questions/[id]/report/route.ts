import { apiUser, fail, json, readJson } from '@/lib/api';
import { createReport } from '@/lib/repo/reports';
import { RuleError } from '@/lib/repo/progress';

export const dynamic = 'force-dynamic';

/** «Сообщить о проблеме» с вопросом. Тело: { reason, comment?, lang? } */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const a = await apiUser({ mutating: true });
  if ('res' in a) return a.res;
  const b = await readJson(req);
  if (!b) return fail(400, 'bad_request');
  try {
    await createReport(a.user.id, { questionId: params.id, reason: b.reason, comment: b.comment, lang: b.lang });
    return json({ ok: true });
  } catch (e) {
    if (e instanceof RuleError) return fail(e.code === 'too_many' ? 429 : 422, e.code);
    throw e;
  }
}

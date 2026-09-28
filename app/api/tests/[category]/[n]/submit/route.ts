import { apiUser, fail, json, readJson } from '@/lib/api';
import { accessInfo } from '@/lib/auth';
import { canOpenTest } from '@/lib/engine';
import { RuleError, submitTest } from '@/lib/repo/progress';
import { TEST_CATEGORIES, type TestCategory } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: { category: string; n: string } }) {
  const a = await apiUser({ mutating: true });
  if ('res' in a) return a.res;
  const category = params.category as TestCategory;
  if (!TEST_CATEGORIES.includes(category)) return fail(404, 'no_such_test');
  const n = Number(params.n);
  if (!Number.isInteger(n) || n < 1) return fail(404, 'no_such_test');
  const acc = accessInfo(a.user);
  if (!canOpenTest(category, n, acc.paid, acc.freeTests)) return fail(402, 'payment_required');
  const body = await readJson(req);
  try {
    return json(await submitTest(a.user.id, category, n, body?.answers));
  } catch (e) {
    if (e instanceof RuleError) {
      const status = e.code === 'locked' ? 403 : e.code === 'no_such_test' ? 404 : 400;
      return fail(status, e.code);
    }
    throw e;
  }
}

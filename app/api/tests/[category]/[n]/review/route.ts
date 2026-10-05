import { apiUser, fail, json, readJson } from '@/lib/api';
import { accessInfo } from '@/lib/auth';
import { canOpenTest } from '@/lib/engine';
import { registerFreeAccess, submitReview } from '@/lib/repo/progress';
import { listTests } from '@/lib/repo/content';
import { TEST_CATEGORIES, type TestCategory } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: { category: string; n: string } }) {
  const a = await apiUser({ mutating: true });
  if ('res' in a) return a.res;
  const category = params.category as TestCategory;
  if (!TEST_CATEGORIES.includes(category)) return fail(404, 'no_such_test');
  const n = Number(params.n);
  if (!Number.isInteger(n) || n < 1) return fail(404, 'no_such_test');
  const item = (await listTests(a.user.id)).find((t) => t.category === category && t.number === n);
  if (!item) return fail(404, 'no_such_test');
  if (item.status === 'locked') return fail(403, 'locked');
  const acc = await accessInfo(a.user);
  if (!canOpenTest(item, acc)) return fail(402, 'payment_required');
  await registerFreeAccess(a.user.id, item, acc);
  const body = await readJson(req);
  return json(await submitReview(a.user.id, category, n, body?.answers));
}

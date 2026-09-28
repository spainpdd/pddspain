import { apiUser, fail, json, readJson } from '@/lib/api';
import { accessInfo } from '@/lib/auth';
import { submitErrors } from '@/lib/repo/progress';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const a = await apiUser({ mutating: true });
  if ('res' in a) return a.res;
  if (!accessInfo(a.user).paid) return fail(402, 'payment_required');
  const body = await readJson(req);
  return json(await submitErrors(a.user.id, body?.answers));
}

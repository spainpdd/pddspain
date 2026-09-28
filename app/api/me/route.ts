import { apiUser, fail, json, readJson } from '@/lib/api';
import { accessInfo } from '@/lib/auth';
import { getProfile, getStats, updateSettings } from '@/lib/repo/users';

export const dynamic = 'force-dynamic';

export async function GET() {
  const a = await apiUser();
  if ('res' in a) return a.res;
  const [stats] = await Promise.all([getStats(a.user.id)]);
  const acc = accessInfo(a.user);
  return json({ profile: a.user, stats, access: { paid: acc.paid, daysLeft: acc.daysLeft, until: a.user.access_until } });
}

export async function PATCH(req: Request) {
  const a = await apiUser({ mutating: true });
  if ('res' in a) return a.res;
  const b = await readJson(req);
  if (!b) return fail(400, 'bad_json');
  const patch: Parameters<typeof updateSettings>[1] = {};
  if (b.study_lang !== undefined) {
    if (!['es', 'en'].includes(b.study_lang)) return fail(400, 'bad_study_lang');
    patch.study_lang = b.study_lang;
  }
  if (b.trans_lang !== undefined) {
    if (!['ru', 'hy'].includes(b.trans_lang)) return fail(400, 'bad_trans_lang');
    patch.trans_lang = b.trans_lang;
  }
  if (b.auto_translate !== undefined) patch.auto_translate = !!b.auto_translate;
  if (b.notify !== undefined) patch.notify = !!b.notify;
  const p = await updateSettings(a.user.id, patch);
  return json({ profile: p ?? (await getProfile(a.user.id)) });
}

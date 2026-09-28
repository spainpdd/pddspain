import { apiUser, fail, json, readJson } from '@/lib/api';
import { createCheckoutUrl, stripeConfigured } from '@/lib/billing';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const a = await apiUser({ mutating: true });
  if ('res' in a) return a.res;
  const b = await readJson(req);
  // без явного согласия на немедленное предоставление контента платёж не создаём (право на desistimiento, 14 дней)
  if (!b?.consent) return fail(400, 'consent_required');
  if (!stripeConfigured()) return fail(503, 'payments_not_configured');
  return json({ url: await createCheckoutUrl(a.user) });
}

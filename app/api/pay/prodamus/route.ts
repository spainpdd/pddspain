import { apiUser, fail, json, readJson } from '@/lib/api';
import { createProdamusPaymentUrl, prodamusConfigured } from '@/lib/prodamus-pay';
import { getDisplayCurrency } from '@/lib/site-currency';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const a = await apiUser({ mutating: true });
  if ('res' in a) return a.res;
  const b = await readJson(req);
  // обе галочки обязательны: оферта + немедленный доступ, и отдельно согласие на обработку ПД
  if (!b?.consent || !b?.privacy) return fail(400, 'consent_required');
  if (!prodamusConfigured()) return fail(503, 'payments_not_configured');
  try {
    const url = await createProdamusPaymentUrl(a.user, { shownCurrency: getDisplayCurrency(a.user.trans_lang), consentAt: new Date() });
    return json({ url });
  } catch (e: any) {
    if (e?.message === 'too_many') return fail(429, 'too_many_attempts');
    console.error('prodamus: не удалось создать платёж', e);
    return fail(500, 'payment_failed');
  }
}

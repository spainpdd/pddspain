import 'server-only';
import { env } from './env';
import { ACCESS_DAYS } from './engine';
import { SERVICE_NAME } from './seller';
import { getPricing } from './repo/config';
import { getProfile } from './repo/users';
import { recordPayment } from './repo/billing';
import { countRecentPendingInvoices, createInvoice, getInvoice, markInvoicePaid } from './repo/robokassa';
import { notifyPaid } from './bot';
import { shownAmount, type ShowCurrency } from './currency';
import {
  buildPaymentUrl, normalizeAlgo, parseOutSum, pickShp, resultAck, verifyResultSignature, type HashAlgo,
} from './robokassa';
import type { Profile } from './types';

export const robokassaConfigured = () => !!(env.robokassaLogin && env.robokassaPass1 && env.robokassaPass2);

const MAX_PENDING_PER_HOUR = 10;

/** Создаёт счёт и возвращает ссылку на страницу оплаты Robokassa. Списание всегда в рублях. */
export async function createRobokassaPaymentUrl(user: Profile, opts: { shownCurrency: ShowCurrency; consentAt: Date }): Promise<string> {
  if (!robokassaConfigured()) throw new Error('not_configured');
  if ((await countRecentPendingInvoices(user.id)) >= MAX_PENDING_PER_HOUR) throw new Error('too_many');
  const pricing = await getPricing();
  const kopecks = pricing.rub * 100;
  const invId = await createInvoice({
    userId: user.id,
    kopecks,
    isTest: env.robokassaTest,
    shownCurrency: opts.shownCurrency,
    shownAmount: shownAmount(pricing, opts.shownCurrency),
    consentAt: opts.consentAt,
  });
  return buildPaymentUrl({
    login: env.robokassaLogin,
    password1: env.robokassaPass1,
    algo: normalizeAlgo(env.robokassaHash),
    kopecks,
    invId,
    description: `${SERVICE_NAME} доступ на ${ACCESS_DAYS} дней`,
    isTest: env.robokassaTest,
    culture: 'ru',
  });
}

type Notify = (telegramId: number, until: string) => Promise<void>;

/**
 * Обработка ResultURL (серверное уведомление Robokassa): проверка подписи (пароль #2), сверка счёта и суммы,
 * выдача доступа. Повторные уведомления безопасны. Ответ: { status, body } — body для успеха строго «OK<InvId>».
 */
export async function processRobokassaResult(
  params: URLSearchParams,
  cfg: { pass2: string; algo: HashAlgo; testMode: boolean },
  notify: Notify = notifyPaid,
): Promise<{ status: number; body: string }> {
  if (!cfg.pass2) return { status: 503, body: 'not configured' };
  const outSum = params.get('OutSum') ?? '';
  const invId = params.get('InvId') ?? '';
  if (!verifyResultSignature({ outSum, invId, signature: params.get('SignatureValue') ?? '', shp: pickShp(params) }, cfg.pass2, cfg.algo)) {
    return { status: 400, body: 'bad signature' };
  }
  const inv = await getInvoice(invId);
  if (!inv) return { status: 400, body: 'unknown invoice' };
  if (inv.is_test !== cfg.testMode) return { status: 400, body: 'mode mismatch' };
  if (parseOutSum(outSum) !== inv.out_sum_kopecks) {
    console.error(`robokassa: сумма ${outSum} не совпала со счётом ${invId} (${inv.out_sum_kopecks} коп.)`);
    return { status: 400, body: 'sum mismatch' };
  }

  // Сначала выдаём доступ (идемпотентно по payments.stripe_session_id = 'rk:<InvId>'), потом помечаем счёт:
  // если процесс упадёт между шагами, повторное уведомление доделает пометку.
  const r = await recordPayment({
    userId: inv.user_id,
    sessionId: `rk:${inv.inv_id}`,
    amountCents: inv.out_sum_kopecks,
    currency: 'rub',
    consentAt: inv.consent_at ? new Date(inv.consent_at) : null,
  });
  const fee = Number(params.get('Fee'));
  await markInvoicePaid(inv.inv_id, { fee: Number.isFinite(fee) ? fee : null, method: params.get('PaymentMethod') });
  if (r.granted) {
    const p = await getProfile(inv.user_id);
    if (p?.access_until) await notify(p.telegram_id, p.access_until).catch(() => {});
  }
  return { status: 200, body: resultAck(inv.inv_id) };
}

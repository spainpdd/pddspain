import 'server-only';
import { env } from './env';
import { ACCESS_DAYS } from './engine';
import { SERVICE_NAME } from './seller';
import { getPricing } from './repo/config';
import { getProfile } from './repo/users';
import { recordPayment } from './repo/billing';
import { countRecentPendingOrders, createOrder, getOrder, markOrderPaid } from './repo/prodamus';
import { notifyPaid } from './bot';
import { shownAmount, type ShowCurrency } from './currency';
import { buildPayUrl, formatRub, normalizeFormUrl, parseSumKopecks, verifyPayload } from './prodamus';
import type { Profile } from './types';

export const prodamusConfigured = () => !!(normalizeFormUrl(env.prodamusFormUrl) && env.prodamusSecret);

const MAX_PENDING_PER_HOUR = 10;

/** Создаёт заказ и возвращает ссылку на форму оплаты Prodamus. Списание всегда в рублях. */
export async function createProdamusPaymentUrl(user: Profile, opts: { shownCurrency: ShowCurrency; consentAt: Date }): Promise<string> {
  const formUrl = normalizeFormUrl(env.prodamusFormUrl);
  if (!formUrl || !env.prodamusSecret) throw new Error('not_configured');
  if ((await countRecentPendingOrders(user.id)) >= MAX_PENDING_PER_HOUR) throw new Error('too_many');
  const pricing = await getPricing();
  const kopecks = pricing.rub * 100;
  const orderId = await createOrder({
    userId: user.id,
    kopecks,
    isTest: env.prodamusTest,
    shownCurrency: opts.shownCurrency,
    shownAmount: shownAmount(pricing, opts.shownCurrency),
    consentAt: opts.consentAt,
  });
  const params: Record<string, unknown> = {
    do: 'pay',
    order_id: orderId,
    products: [{ name: `${SERVICE_NAME} доступ на ${ACCESS_DAYS} дней`.slice(0, 128), price: formatRub(kopecks), quantity: '1' }],
    urlReturn: `${env.siteUrl}/pay/fail`,
    urlSuccess: `${env.siteUrl}/pay/success`,
    urlNotification: `${env.siteUrl}/api/prodamus/webhook`,
  };
  if (env.prodamusSys) params.sys = env.prodamusSys;
  if (env.prodamusTest) params.demo_mode = '1';
  return buildPayUrl(formUrl, params, env.prodamusSignLink ? env.prodamusSecret : undefined);
}

type Notify = (telegramId: number, until: string) => Promise<void>;

/**
 * Обработка серверного уведомления Prodamus: подпись (заголовок Sign), сверка заказа и суммы, выдача доступа.
 * Повторные уведомления безопасны. Любые «не наши» статусы (отмена, отказ) подтверждаем 200 и ничего не делаем.
 */
export async function processProdamusWebhook(
  data: Record<string, unknown>,
  sign: string,
  cfg: { secrets: string[]; testMode: boolean },
  notify: Notify = notifyPaid,
): Promise<{ status: number; body: string }> {
  const secrets = cfg.secrets.filter(Boolean);
  if (secrets.length === 0) return { status: 503, body: 'not configured' };
  if (!verifyPayload(data, sign, secrets)) return { status: 400, body: 'bad signature' };

  const status = String(data.payment_status ?? '');
  if (status !== 'success') return { status: 200, body: 'ignored' };

  const orderNum = String(data.order_num ?? '');
  const order = await getOrder(orderNum);
  if (!order) return { status: 400, body: 'unknown order' };

  const isTestPayment = String(data.is_test ?? '') === '1';
  if (isTestPayment && !cfg.testMode) return { status: 200, body: 'test ignored' };
  if (order.is_test !== cfg.testMode) return { status: 400, body: 'mode mismatch' };

  const paid = parseSumKopecks(data.sum);
  if (paid === null || paid < order.sum_kopecks) {
    console.error(`prodamus: сумма ${String(data.sum)} не совпала с заказом ${orderNum} (${order.sum_kopecks} коп.)`);
    return { status: 400, body: 'sum mismatch' };
  }

  // Сначала выдаём доступ (идемпотентно по payments.stripe_session_id = 'pd:<order_id>'), потом помечаем заказ:
  // если процесс упадёт между шагами, повторное уведомление доделает пометку.
  const r = await recordPayment({
    userId: order.user_id,
    sessionId: `pd:${order.order_id}`,
    amountCents: order.sum_kopecks,
    currency: 'rub',
    consentAt: order.consent_at ? new Date(order.consent_at) : null,
  });
  await markOrderPaid(order.order_id, {
    method: data.payment_type ? String(data.payment_type) : null,
    prodamusId: data.order_id ? String(data.order_id) : null,
  });
  if (r.granted) {
    const p = await getProfile(order.user_id);
    if (p?.access_until) await notify(p.telegram_id, p.access_until).catch(() => {});
  }
  return { status: 200, body: 'OK' };
}

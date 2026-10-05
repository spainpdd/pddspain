import 'server-only';
import { DGT_BUYER_NOTICE } from './legal-notes';
import Stripe from 'stripe';
import { env } from './env';
import { ACCESS_DAYS, PRICE_CENTS } from './engine';
import { recordPayment } from './repo/billing';
import { getProfile } from './repo/users';
import { getPricing } from './repo/config';
import { notifyPaid } from './bot';
import type { Profile } from './types';

export function stripeClient(): Stripe {
  if (!env.stripeSecret) throw new Error('STRIPE_SECRET_KEY не задан');
  return new Stripe(env.stripeSecret);
}

export const stripeConfigured = () => !!env.stripeSecret;

export async function createCheckoutUrl(user: Profile): Promise<string> {
  const stripe = stripeClient();
  const priceId = process.env.STRIPE_PRICE_ID;
  const pricing = priceId ? null : await getPricing();
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    client_reference_id: user.id,
    metadata: { user_id: user.id, consent_at: new Date().toISOString() },
    line_items: [
      priceId
        ? { price: priceId, quantity: 1 }
        : {
            quantity: 1,
            price_data: {
              currency: 'eur',
              unit_amount: pricing?.eur_cents ?? PRICE_CENTS,
              product_data: {
                name: `DGT Права — доступ на ${ACCESS_DAYS} дней`,
                description: 'Все тесты, раздел ошибок, переводы RU/HY. Гарантия: доступ продлевается, пока не сдадите экзамен.',
              },
            },
          },
    ],
    allow_promotion_codes: true,
    // DGT: покупателя нужно предупредить в ходе оплаты, что официальные материалы доступны бесплатно
    custom_text: { submit: { message: DGT_BUYER_NOTICE.slice(0, 1000) } },
    success_url: `${env.siteUrl}/pay/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.siteUrl}/pay`,
  });
  if (!session.url) throw new Error('Stripe не вернул ссылку на оплату');
  return session.url;
}

/**
 * Выдаёт доступ по оплаченной Checkout-сессии. Идемпотентно (см. recordPayment),
 * поэтому безопасно вызывать и из вебхука, и со страницы «спасибо».
 */
export async function fulfillSession(session: Stripe.Checkout.Session): Promise<{ granted: boolean; userId?: string }> {
  if (session.payment_status !== 'paid') return { granted: false };
  const userId = session.client_reference_id || session.metadata?.user_id;
  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) return { granted: false };
  const consent = session.metadata?.consent_at ? new Date(session.metadata.consent_at) : null;
  const r = await recordPayment({
    userId,
    sessionId: session.id,
    amountCents: session.amount_total ?? PRICE_CENTS,
    currency: session.currency ?? 'eur',
    consentAt: consent && !Number.isNaN(consent.getTime()) ? consent : null,
  });
  if (r.granted) {
    const p = await getProfile(userId);
    if (p?.access_until) await notifyPaid(p.telegram_id, p.access_until);
  }
  return { granted: r.granted, userId };
}

export async function processStripeWebhook(rawBody: string, signature: string | null) {
  if (!env.stripeWebhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET не задан');
  if (!signature) throw new Error('нет подписи');
  const stripe = new Stripe(env.stripeSecret || 'sk_unused');
  const event = stripe.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    return fulfillSession(event.data.object as Stripe.Checkout.Session);
  }
  return { granted: false };
}

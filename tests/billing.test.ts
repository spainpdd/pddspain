import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Stripe from 'stripe';

vi.mock('server-only', () => ({}));

import type { Db } from '../lib/db';
import { makeDb, makeUser } from './helpers';
import { getProfile } from '../lib/repo/users';

let db: Db;
beforeEach(async () => {
  db = await makeDb();
  process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_testsecret';
});
afterEach(async () => {
  await db.close();
});

function signedEvent(type: string, session: Record<string, unknown>) {
  const payload = JSON.stringify({ id: 'evt_1', object: 'event', type, data: { object: { object: 'checkout.session', ...session } } });
  const header = Stripe.webhooks.generateTestHeaderString({ payload, secret: 'whsec_testsecret' });
  return { payload, header };
}

describe('вебхук Stripe', () => {
  it('оплаченная сессия открывает доступ на 100 дней; повторная доставка ничего не добавляет', async () => {
    const { processStripeWebhook } = await import('../lib/billing');
    const u = await makeUser();
    const { payload, header } = signedEvent('checkout.session.completed', {
      id: 'cs_test_1', payment_status: 'paid', client_reference_id: u.id, amount_total: 5000, currency: 'eur',
      metadata: { user_id: u.id, consent_at: '2026-09-21T10:00:00.000Z' },
    });
    expect(await processStripeWebhook(payload, header)).toMatchObject({ granted: true });
    expect(await processStripeWebhook(payload, header)).toMatchObject({ granted: false });
    const p = (await getProfile(u.id))!;
    const days = (new Date(p.access_until!).getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(99.9);
    expect(days).toBeLessThan(100.1);
    expect((await db.query('select consent_at from payments'))[0].consent_at).not.toBeNull();
  });

  it('неоплаченная сессия, чужое событие и подделанная подпись доступ не дают', async () => {
    const { processStripeWebhook } = await import('../lib/billing');
    const u = await makeUser();
    const unpaid = signedEvent('checkout.session.completed', { id: 'cs_2', payment_status: 'unpaid', client_reference_id: u.id });
    expect(await processStripeWebhook(unpaid.payload, unpaid.header)).toMatchObject({ granted: false });
    const other = signedEvent('customer.created', { id: 'cs_3', payment_status: 'paid', client_reference_id: u.id });
    expect(await processStripeWebhook(other.payload, other.header)).toMatchObject({ granted: false });
    const ok = signedEvent('checkout.session.completed', { id: 'cs_4', payment_status: 'paid', client_reference_id: u.id });
    await expect(processStripeWebhook(ok.payload + ' ', ok.header)).rejects.toThrow();
    await expect(processStripeWebhook(ok.payload, 't=1,v1=deadbeef')).rejects.toThrow();
    await expect(processStripeWebhook(ok.payload, null)).rejects.toThrow();
    expect((await getProfile(u.id))!.access_until).toBeNull();
  });

  it('async_payment_succeeded (SEPA и др.) тоже выдаёт доступ; кривой client_reference_id игнорируется', async () => {
    const { processStripeWebhook } = await import('../lib/billing');
    const u = await makeUser();
    const e1 = signedEvent('checkout.session.async_payment_succeeded', { id: 'cs_5', payment_status: 'paid', client_reference_id: u.id, amount_total: 5000 });
    expect(await processStripeWebhook(e1.payload, e1.header)).toMatchObject({ granted: true });
    const e2 = signedEvent('checkout.session.completed', { id: 'cs_6', payment_status: 'paid', client_reference_id: "x'; drop table profiles;--" });
    expect(await processStripeWebhook(e2.payload, e2.header)).toMatchObject({ granted: false });
  });
});

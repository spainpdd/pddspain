import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import type { Db } from '../lib/db';
import { makeDb, makeUser } from './helpers';
import { getProfile } from '../lib/repo/users';
import { getPlanPrices, setPlanPrice } from '../lib/repo/config';
import { createOrder, getOrder } from '../lib/repo/prodamus';
import { PLANS, getPlan, isPlanId, perDayAmount } from '../lib/plans';
import { signPayload, nestPairs } from '../lib/prodamus';

let db: Db;
beforeEach(async () => {
  db = await makeDb();
});
afterEach(async () => {
  await db.close();
});

const SECRET = 'shop_secret';
const cfg = { secrets: [SECRET], testMode: false };

function webhook(orderNum: string, sum: string) {
  const data = nestPairs(Object.entries({ order_id: '777', order_num: orderNum, sum, payment_status: 'success', payment_type: 'card' }));
  return { data, sign: signPayload(data, SECRET) };
}

describe('тарифы', () => {
  it('три тарифа: 7, 60 и 100 дней, гарантия только на 100', () => {
    expect(PLANS.map((p) => [p.id, p.days, p.guarantee])).toEqual([['week', 7, false], ['m2', 60, false], ['d100', 100, true]]);
    expect(isPlanId('week')).toBe(true);
    expect(isPlanId('year')).toBe(false);
    expect(getPlan('m2')?.days).toBe(60);
    expect(getPlan('nope')).toBeNull();
  });

  it('цена в день', () => {
    expect(perDayAmount({ eur_cents: 1000, rub: 1000, amd: 4900 }, 7, 'EUR')).toBe('1,43 €');
    expect(perDayAmount({ eur_cents: 3500, rub: 3500, amd: 17100 }, 60, 'EUR')).toBe('0,58 €');
    expect(perDayAmount({ eur_cents: 4900, rub: 4900, amd: 23900 }, 100, 'EUR')).toBe('0,49 €');
    expect(perDayAmount({ eur_cents: 1000, rub: 1000, amd: 4900 }, 7, 'RUB')).toBe('143 ₽');
    expect(perDayAmount({ eur_cents: 1000, rub: 1000, amd: 4900 }, 7, 'AMD')).toBe('700 ֏');
  });

  it('цены по умолчанию и редактирование из админки', async () => {
    const p = await getPlanPrices();
    expect(p.week).toEqual({ eur_cents: 1000, rub: 1000, amd: 4900 });
    expect(p.m2).toEqual({ eur_cents: 3500, rub: 3500, amd: 17100 });
    expect(p.d100).toEqual({ eur_cents: 4900, rub: 4900, amd: 23900 });
    await setPlanPrice('week', { rub: 1200 });
    await setPlanPrice('d100', { rub: 5000 });
    const q = await getPlanPrices();
    expect(q.week).toEqual({ eur_cents: 1000, rub: 1200, amd: 4900 });
    expect(q.m2.rub).toBe(3500);
    expect(q.d100.rub).toBe(5000);
    await setPlanPrice('m2', { eur_cents: 3900 });
    expect((await getPlanPrices()).week.rub).toBe(1200); // соседний тариф не затёрт
  });
});

describe('оплата по тарифам', () => {
  it('неделя: +7 дней, гарантии нет', async () => {
    const { processProdamusWebhook } = await import('../lib/prodamus-pay');
    const u = await makeUser();
    const id = await createOrder({ userId: u.id, kopecks: 100000, plan: 'week', days: 7, isTest: false });
    const w = webhook(id, '1000.00');
    expect((await processProdamusWebhook(w.data, w.sign, cfg, async () => {})).status).toBe(200);
    const p = await getProfile(u.id);
    expect(Math.round((new Date(p!.access_until!).getTime() - Date.now()) / 86_400_000)).toBe(7);
    expect(p!.guarantee_eligible).toBe(false);
    expect(await db.query('select days_granted, amount_cents from payments where user_id = $1', [u.id])).toEqual([{ days_granted: 7, amount_cents: 100000 }]);
  });

  it('2 месяца: +60 дней, гарантии нет', async () => {
    const { processProdamusWebhook } = await import('../lib/prodamus-pay');
    const u = await makeUser();
    const id = await createOrder({ userId: u.id, kopecks: 350000, plan: 'm2', days: 60, isTest: false });
    const w = webhook(id, '3500.00');
    await processProdamusWebhook(w.data, w.sign, cfg, async () => {});
    const p = await getProfile(u.id);
    expect(Math.round((new Date(p!.access_until!).getTime() - Date.now()) / 86_400_000)).toBe(60);
    expect(p!.guarantee_eligible).toBe(false);
  });

  it('100 дней: +100 дней и гарантия; неделя после этого гарантию не снимает', async () => {
    const { processProdamusWebhook } = await import('../lib/prodamus-pay');
    const u = await makeUser();
    const a = await createOrder({ userId: u.id, kopecks: 490000, plan: 'd100', days: 100, isTest: false });
    const wa = webhook(a, '4900.00');
    await processProdamusWebhook(wa.data, wa.sign, cfg, async () => {});
    expect((await getProfile(u.id))!.guarantee_eligible).toBe(true);
    const b = await createOrder({ userId: u.id, kopecks: 100000, plan: 'week', days: 7, isTest: false });
    const wb = webhook(b, '1000.00');
    await processProdamusWebhook(wb.data, wb.sign, cfg, async () => {});
    const p = await getProfile(u.id);
    expect(p!.guarantee_eligible).toBe(true);
    expect(Math.round((new Date(p!.access_until!).getTime() - Date.now()) / 86_400_000)).toBe(107);
  });

  it('заказ без указания тарифа — как раньше: 100 дней с гарантией', async () => {
    const id = await createOrder({ userId: (await makeUser()).id, kopecks: 490000, isTest: false });
    expect(await getOrder(id)).toMatchObject({ plan: 'd100', days: 100 });
  });

  it('ссылка на оплату: сумма и название по тарифу, заказ запоминает срок', async () => {
    const { createProdamusPaymentUrl } = await import('../lib/prodamus-pay');
    const keep = { f: process.env.PRODAMUS_FORM_URL, s: process.env.PRODAMUS_SECRET };
    process.env.PRODAMUS_SECRET = SECRET;
    delete process.env.PRODAMUS_FORM_URL;
    try {
      const u = await makeUser();
      const url = new URL(await createProdamusPaymentUrl(u, { plan: 'm2', shownCurrency: 'EUR', consentAt: new Date() }));
      expect(url.origin).toBe('https://pravaes.payform.ru');
      expect(url.searchParams.get('products[0][price]')).toBe('3500.00');
      expect(url.searchParams.get('products[0][name]')).toContain('60 дней');
      const order = await getOrder(url.searchParams.get('order_id')!);
      expect(order).toMatchObject({ plan: 'm2', days: 60, sum_kopecks: 350000, user_id: u.id });
      await expect(createProdamusPaymentUrl(u, { plan: 'bad' as any, shownCurrency: 'EUR', consentAt: new Date() })).rejects.toThrow('bad_plan');
    } finally {
      if (keep.f === undefined) delete process.env.PRODAMUS_FORM_URL; else process.env.PRODAMUS_FORM_URL = keep.f;
      if (keep.s === undefined) delete process.env.PRODAMUS_SECRET; else process.env.PRODAMUS_SECRET = keep.s;
    }
  });
});

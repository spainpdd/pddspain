import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import type { Db } from '../lib/db';
import { makeDb, makeUser } from './helpers';
import { getProfile } from '../lib/repo/users';
import { createOrder, getOrder, markOrderPaid, countRecentPendingOrders } from '../lib/repo/prodamus';
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
const notifyNoop = async () => {};

/** Тело уведомления так, как его присылает Prodamus (form-urlencoded), и заголовок Sign */
function webhook(orderNum: string, sum: string, extra: Record<string, string> = {}, secret = SECRET) {
  const flat: Record<string, string> = {
    date: '2026-10-05T12:00:00+03:00', order_id: '5550001', order_num: orderNum, domain: 'pravaes.payform.ru',
    sum, currency: 'rub', payment_type: 'Банковская карта', payment_status: 'success',
    'products[0][name]': 'Права Испании', 'products[0][price]': sum, 'products[0][quantity]': '1', 'products[0][sum]': sum,
    ...extra,
  };
  const data = nestPairs(Object.entries(flat));
  return { data, sign: signPayload(data, secret) };
}

describe('заказы Prodamus', () => {
  it('создаётся заказ с числовым номером, сумма хранится в рублях', async () => {
    const u = await makeUser();
    const id = await createOrder({ userId: u.id, kopecks: 490000, isTest: true, shownCurrency: 'EUR', shownAmount: 49, consentAt: new Date() });
    expect(id).toMatch(/^\d+$/);
    expect(Number(id)).toBeGreaterThanOrEqual(10001);
    expect(await getOrder(id)).toMatchObject({ user_id: u.id, sum_kopecks: 490000, status: 'pending', is_test: true, shown_currency: 'EUR' });
  });

  it('номера не повторяются, markOrderPaid срабатывает один раз, мусор не находится', async () => {
    const u = await makeUser();
    const a = await createOrder({ userId: u.id, kopecks: 100, isTest: false });
    const b = await createOrder({ userId: u.id, kopecks: 100, isTest: false });
    expect(a).not.toBe(b);
    expect(await countRecentPendingOrders(u.id)).toBe(2);
    expect(await markOrderPaid(a, { method: 'card', prodamusId: '1' })).toBe(true);
    expect(await markOrderPaid(a)).toBe(false);
    expect(await getOrder(a)).toMatchObject({ status: 'paid' });
    expect(await countRecentPendingOrders(u.id)).toBe(1);
    expect(await getOrder('abc')).toBeNull();
    expect(await getOrder('999999')).toBeNull();
    expect(await markOrderPaid('abc')).toBe(false);
  });
});

describe('вебхук Prodamus', () => {
  it('верное уведомление открывает доступ на 100 дней и отвечает 200', async () => {
    const { processProdamusWebhook } = await import('../lib/prodamus-pay');
    const u = await makeUser();
    const id = await createOrder({ userId: u.id, kopecks: 490000, isTest: false, shownCurrency: 'EUR', shownAmount: 49, consentAt: new Date() });
    const notify = vi.fn(async () => {});
    const w = webhook(id, '4900.00');
    expect(await processProdamusWebhook(w.data, w.sign, cfg, notify)).toEqual({ status: 200, body: 'OK' });

    const p = await getProfile(u.id);
    const days = Math.round((new Date(p!.access_until!).getTime() - Date.now()) / 86_400_000);
    expect(days).toBe(100);
    expect(await getOrder(id)).toMatchObject({ status: 'paid' });
    expect(notify).toHaveBeenCalledTimes(1);
    const pay = (await db.query('select stripe_session_id, amount_cents, currency, consent_at from payments where user_id = $1', [u.id]))[0];
    expect(pay).toMatchObject({ stripe_session_id: `pd:${id}`, amount_cents: 490000, currency: 'rub' });
    expect(pay.consent_at).not.toBeNull();
  });

  it('повторное уведомление отвечает 200, но ничего не продлевает и не шлёт второе сообщение', async () => {
    const { processProdamusWebhook } = await import('../lib/prodamus-pay');
    const u = await makeUser();
    const id = await createOrder({ userId: u.id, kopecks: 490000, isTest: false });
    const notify = vi.fn(async () => {});
    const w = webhook(id, '4900.00');
    await processProdamusWebhook(w.data, w.sign, cfg, notify);
    const first = (await getProfile(u.id))!.access_until;
    expect(await processProdamusWebhook(w.data, w.sign, cfg, notify)).toEqual({ status: 200, body: 'OK' });
    expect((await getProfile(u.id))!.access_until).toBe(first);
    expect(notify).toHaveBeenCalledTimes(1);
    expect(await db.query('select 1 from payments where user_id = $1', [u.id])).toHaveLength(1);
  });

  it('неверная подпись, чужой ключ, неизвестный заказ — отказ без выдачи доступа', async () => {
    const { processProdamusWebhook } = await import('../lib/prodamus-pay');
    const u = await makeUser();
    const id = await createOrder({ userId: u.id, kopecks: 490000, isTest: false });
    const bad = webhook(id, '4900.00', {}, 'wrong');
    expect((await processProdamusWebhook(bad.data, bad.sign, cfg, notifyNoop)).body).toBe('bad signature');
    const good = webhook(id, '4900.00');
    expect((await processProdamusWebhook(good.data, '', cfg, notifyNoop)).status).toBe(400);
    const tampered = { ...good.data, sum: '1.00' };
    expect((await processProdamusWebhook(tampered, good.sign, cfg, notifyNoop)).status).toBe(400);
    const unknown = webhook('999999', '4900.00');
    expect((await processProdamusWebhook(unknown.data, unknown.sign, cfg, notifyNoop)).body).toBe('unknown order');
    expect((await getProfile(u.id))!.access_until).toBeNull();
    expect(await getOrder(id)).toMatchObject({ status: 'pending' });
  });

  it('принимает и второй (сервисный) ключ', async () => {
    const { processProdamusWebhook } = await import('../lib/prodamus-pay');
    const u = await makeUser();
    const id = await createOrder({ userId: u.id, kopecks: 490000, isTest: false });
    const w = webhook(id, '4900.00', {}, 'service_key');
    expect((await processProdamusWebhook(w.data, w.sign, { ...cfg, secrets: [SECRET, 'service_key'] }, notifyNoop)).status).toBe(200);
    expect(await getOrder(id)).toMatchObject({ status: 'paid' });
  });

  it('сумма меньше заказа — отказ; больше (комиссия сверху) — принимается', async () => {
    const { processProdamusWebhook } = await import('../lib/prodamus-pay');
    const u = await makeUser();
    const id = await createOrder({ userId: u.id, kopecks: 490000, isTest: false });
    const low = webhook(id, '1.00');
    expect(await processProdamusWebhook(low.data, low.sign, cfg, notifyNoop)).toEqual({ status: 400, body: 'sum mismatch' });
    expect((await getProfile(u.id))!.access_until).toBeNull();
    const high = webhook(id, '5000.00');
    expect((await processProdamusWebhook(high.data, high.sign, cfg, notifyNoop)).status).toBe(200);
    expect(await db.query('select amount_cents from payments where user_id = $1', [u.id])).toEqual([{ amount_cents: 490000 }]);
  });

  it('отмена и отказ подтверждаются 200, но доступ не выдаётся', async () => {
    const { processProdamusWebhook } = await import('../lib/prodamus-pay');
    const u = await makeUser();
    const id = await createOrder({ userId: u.id, kopecks: 490000, isTest: false });
    for (const st of ['order_canceled', 'order_denied', 'whatever']) {
      const w = webhook(id, '4900.00', { payment_status: st });
      expect(await processProdamusWebhook(w.data, w.sign, cfg, notifyNoop)).toEqual({ status: 200, body: 'ignored' });
    }
    expect((await getProfile(u.id))!.access_until).toBeNull();
    expect(await getOrder(id)).toMatchObject({ status: 'pending' });
  });

  it('тестовые платежи: в боевом режиме игнорируются, в тестовом принимаются; без ключей — 503', async () => {
    const { processProdamusWebhook } = await import('../lib/prodamus-pay');
    const u = await makeUser();
    const live = await createOrder({ userId: u.id, kopecks: 490000, isTest: false });
    const t = webhook(live, '4900.00', { is_test: '1' });
    expect(await processProdamusWebhook(t.data, t.sign, cfg, notifyNoop)).toEqual({ status: 200, body: 'test ignored' });
    expect((await getProfile(u.id))!.access_until).toBeNull();

    const test = await createOrder({ userId: u.id, kopecks: 490000, isTest: true });
    const w = webhook(test, '4900.00', { is_test: '1' });
    expect((await processProdamusWebhook(w.data, w.sign, cfg, notifyNoop)).body).toBe('test ignored');
    expect((await processProdamusWebhook(w.data, w.sign, { ...cfg, testMode: true }, notifyNoop)).status).toBe(200);
    expect((await getProfile(u.id))!.access_until).not.toBeNull();
    // боевой заказ в тестовом режиме — несоответствие режимов
    const w2 = webhook(live, '4900.00');
    expect((await processProdamusWebhook(w2.data, w2.sign, { ...cfg, testMode: true }, notifyNoop)).body).toBe('mode mismatch');
    expect((await processProdamusWebhook(w.data, w.sign, { ...cfg, secrets: [''] }, notifyNoop)).status).toBe(503);
  });
});

describe('настройка оплаты', () => {
  it('адрес формы по умолчанию — pravaes.payform.ru; без секретного ключа оплата не включена', async () => {
    const { prodamusConfigured } = await import('../lib/prodamus-pay');
    const { env } = await import('../lib/env');
    const keep = { f: process.env.PRODAMUS_FORM_URL, s: process.env.PRODAMUS_SECRET };
    try {
      delete process.env.PRODAMUS_FORM_URL;
      delete process.env.PRODAMUS_SECRET;
      expect(env.prodamusFormUrl).toBe('https://pravaes.payform.ru');
      expect(prodamusConfigured()).toBe(false);
      process.env.PRODAMUS_SECRET = 'k';
      expect(prodamusConfigured()).toBe(true);
      process.env.PRODAMUS_FORM_URL = 'https://evil.example.com';
      expect(prodamusConfigured()).toBe(false);
    } finally {
      if (keep.f === undefined) delete process.env.PRODAMUS_FORM_URL; else process.env.PRODAMUS_FORM_URL = keep.f;
      if (keep.s === undefined) delete process.env.PRODAMUS_SECRET; else process.env.PRODAMUS_SECRET = keep.s;
    }
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import type { Db } from '../lib/db';
import { makeDb, makeUser } from './helpers';
import { getProfile } from '../lib/repo/users';
import { createInvoice, getInvoice } from '../lib/repo/robokassa';
import { hashHex } from '../lib/robokassa';

let db: Db;
beforeEach(async () => {
  db = await makeDb();
});
afterEach(async () => {
  await db.close();
});

const cfg = { pass2: 'secret2', algo: 'md5' as const, testMode: false };
const notifyNoop = async () => {};

function notification(outSum: string, invId: string, extra: Record<string, string> = {}, pass = 'secret2') {
  const p = new URLSearchParams({ OutSum: outSum, InvId: invId, SignatureValue: hashHex(`${outSum}:${invId}:${pass}`, 'md5'), ...extra });
  return p;
}

describe('ResultURL Robokassa', () => {
  it('верное уведомление открывает доступ на 100 дней и отвечает OK<InvId>', async () => {
    const { processRobokassaResult } = await import('../lib/robokassa-pay');
    const u = await makeUser();
    const id = await createInvoice({ userId: u.id, kopecks: 490000, isTest: false, shownCurrency: 'EUR', shownAmount: 49, consentAt: new Date() });
    const notify = vi.fn(async () => {});

    const r = await processRobokassaResult(notification('4900.000000', id, { Fee: '166.60', PaymentMethod: 'BankCard' }), cfg, notify);
    expect(r).toEqual({ status: 200, body: `OK${id}` });

    const p = await getProfile(u.id);
    const days = Math.round((new Date(p!.access_until!).getTime() - Date.now()) / 86_400_000);
    expect(days).toBe(100);
    expect(await getInvoice(id)).toMatchObject({ status: 'paid' });
    expect(notify).toHaveBeenCalledTimes(1);
    const pay = (await db.query('select amount_cents, currency, consent_at from payments where user_id = $1', [u.id]))[0];
    expect(pay).toMatchObject({ amount_cents: 490000, currency: 'rub' });
    expect(pay.consent_at).not.toBeNull();
  });

  it('повторное уведомление отвечает OK, но ничего не продлевает и не шлёт второе сообщение', async () => {
    const { processRobokassaResult } = await import('../lib/robokassa-pay');
    const u = await makeUser();
    const id = await createInvoice({ userId: u.id, kopecks: 490000, isTest: false });
    const notify = vi.fn(async () => {});
    await processRobokassaResult(notification('4900.000000', id), cfg, notify);
    const first = (await getProfile(u.id))!.access_until;
    const again = await processRobokassaResult(notification('4900.000000', id), cfg, notify);
    expect(again).toEqual({ status: 200, body: `OK${id}` });
    expect((await getProfile(u.id))!.access_until).toBe(first);
    expect(notify).toHaveBeenCalledTimes(1);
    expect(await db.query('select 1 from payments where user_id = $1', [u.id])).toHaveLength(1);
  });

  it('неверная подпись, чужой пароль, неизвестный счёт — отказ без выдачи доступа', async () => {
    const { processRobokassaResult } = await import('../lib/robokassa-pay');
    const u = await makeUser();
    const id = await createInvoice({ userId: u.id, kopecks: 490000, isTest: false });
    expect((await processRobokassaResult(notification('4900.00', id, {}, 'wrong'), cfg, notifyNoop)).status).toBe(400);
    expect((await processRobokassaResult(notification('4900.00', '999999'), cfg, notifyNoop)).body).toBe('unknown invoice');
    expect((await processRobokassaResult(new URLSearchParams({ OutSum: '4900.00', InvId: id }), cfg, notifyNoop)).status).toBe(400);
    expect((await getProfile(u.id))!.access_until).toBeNull();
    expect(await getInvoice(id)).toMatchObject({ status: 'pending' });
  });

  it('сумма не совпала со счётом — отказ (подпись валидна, но платёж другой)', async () => {
    const { processRobokassaResult } = await import('../lib/robokassa-pay');
    const u = await makeUser();
    const id = await createInvoice({ userId: u.id, kopecks: 490000, isTest: false });
    const r = await processRobokassaResult(notification('1.00', id), cfg, notifyNoop);
    expect(r).toEqual({ status: 400, body: 'sum mismatch' });
    expect((await getProfile(u.id))!.access_until).toBeNull();
  });

  it('тестовый счёт не принимается в боевом режиме и наоборот; без пароля — 503', async () => {
    const { processRobokassaResult } = await import('../lib/robokassa-pay');
    const u = await makeUser();
    const test = await createInvoice({ userId: u.id, kopecks: 490000, isTest: true });
    expect((await processRobokassaResult(notification('4900.00', test), cfg, notifyNoop)).body).toBe('mode mismatch');
    expect((await processRobokassaResult(notification('4900.00', test), { ...cfg, testMode: true }, notifyNoop)).status).toBe(200);
    expect((await processRobokassaResult(notification('4900.00', test), { ...cfg, pass2: '' }, notifyNoop)).status).toBe(503);
  });
});

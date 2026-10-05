import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Db } from '../lib/db';
import { makeDb } from './helpers';
import { createInvoice, getInvoice, markInvoicePaid } from '../lib/repo/robokassa';
import { upsertTelegramUser } from '../lib/repo/users';

let db: Db;
beforeEach(async () => {
  db = await makeDb();
});
afterEach(async () => {
  await db.close();
});

describe('счета Robokassa', () => {
  it('создаётся счёт с числовым номером, сумма хранится в рублях', async () => {
    const u = await upsertTelegramUser({ id: 501, first_name: 'Ann' });
    const id = await createInvoice({ userId: u.id, kopecks: 490000, isTest: true, shownCurrency: 'EUR', shownAmount: 49, consentAt: new Date() });
    expect(id).toMatch(/^\d+$/);
    expect(Number(id)).toBeGreaterThanOrEqual(10001);
    expect(await getInvoice(id)).toMatchObject({ user_id: u.id, out_sum_kopecks: 490000, status: 'pending', is_test: true, shown_currency: 'EUR' });
  });

  it('номера счетов не повторяются', async () => {
    const u = await upsertTelegramUser({ id: 502, first_name: 'Bob' });
    const a = await createInvoice({ userId: u.id, kopecks: 100, isTest: false });
    const b = await createInvoice({ userId: u.id, kopecks: 100, isTest: false });
    expect(a).not.toBe(b);
  });

  it('markInvoicePaid срабатывает ровно один раз', async () => {
    const u = await upsertTelegramUser({ id: 503, first_name: 'Cy' });
    const id = await createInvoice({ userId: u.id, kopecks: 490000, isTest: false });
    expect(await markInvoicePaid(id, { fee: 166.6, method: 'BankCard' })).toBe(true);
    expect(await markInvoicePaid(id)).toBe(false);
    expect(await getInvoice(id)).toMatchObject({ status: 'paid' });
  });

  it('мусорный номер и неизвестный счёт', async () => {
    expect(await getInvoice('abc')).toBeNull();
    expect(await getInvoice('99999999')).toBeNull();
    expect(await markInvoicePaid("1; drop table x")).toBe(false);
  });
});

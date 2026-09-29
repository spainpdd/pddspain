import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Db } from '../lib/db';
import { makeDb } from './helpers';
import { createLoginTicket, confirmLoginTicket, getLoginTicket } from '../lib/repo/login-tickets';

let db: Db;
beforeEach(async () => {
  db = await makeDb();
});
afterEach(async () => {
  await db.close();
});

describe('тикеты входа через бота', () => {
  it('создаётся pending-тикет, подтверждение боту его закрывает', async () => {
    const token = await createLoginTicket();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/); // совместим с Telegram /start-payload

    expect(await getLoginTicket(token)).toMatchObject({ status: 'pending', telegram_id: null });

    expect(await confirmLoginTicket(token, 777)).toBe(true);
    expect(await getLoginTicket(token)).toMatchObject({ status: 'confirmed', telegram_id: 777 });
  });

  it('повторное подтверждение того же тикета не проходит', async () => {
    const token = await createLoginTicket();
    expect(await confirmLoginTicket(token, 111)).toBe(true);
    expect(await confirmLoginTicket(token, 222)).toBe(false);
    expect(await getLoginTicket(token)).toMatchObject({ telegram_id: 111 }); // не перезаписался
  });

  it('неизвестный токен: подтверждение не проходит, чтение — null', async () => {
    expect(await confirmLoginTicket('does-not-exist', 1)).toBe(false);
    expect(await getLoginTicket('does-not-exist')).toBeNull();
  });

  it('истёкший тикет не подтверждается и не читается', async () => {
    const token = await createLoginTicket();
    await db.query(`update login_tickets set expires_at = now() - interval '1 second' where token = $1`, [token]);
    expect(await getLoginTicket(token)).toBeNull();
    expect(await confirmLoginTicket(token, 1)).toBe(false);
  });
});

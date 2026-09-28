import { describe, it, expect } from 'vitest';
import { signSession, verifySession } from '../lib/session';
import { computeTelegramHash, verifyTelegramLogin } from '../lib/telegram-auth';

const SECRET = 'test-secret-0123456789';

describe('сессия', () => {
  it('подписывает и проверяет', () => {
    const t = signSession('user-1', { secret: SECRET });
    expect(verifySession(t, { secret: SECRET })).toBe('user-1');
  });
  it('подделка и чужой секрет отклоняются', () => {
    const t = signSession('user-1', { secret: SECRET });
    const [p, s] = t.split('.');
    const forged = Buffer.from(JSON.stringify({ uid: 'admin', exp: Date.now() + 1e9 })).toString('base64url');
    expect(verifySession(`${forged}.${s}`, { secret: SECRET })).toBeNull();
    expect(verifySession(t, { secret: 'other-secret-0123456789' })).toBeNull();
    expect(verifySession(`${p}.`, { secret: SECRET })).toBeNull();
    expect(verifySession('garbage', { secret: SECRET })).toBeNull();
    expect(verifySession('a.b.c', { secret: SECRET })).toBeNull();
    expect(verifySession(undefined, { secret: SECRET })).toBeNull();
  });
  it('истёкшая сессия отклоняется', () => {
    const t = signSession('u', { secret: SECRET, now: 1_000_000, days: 1 });
    expect(verifySession(t, { secret: SECRET, now: 1_000_000 + 86_400_000 - 1 })).toBe('u');
    expect(verifySession(t, { secret: SECRET, now: 1_000_000 + 86_400_000 + 1 })).toBeNull();
  });
});

describe('Telegram Login Widget', () => {
  const BOT = '123456:ABC-DEF_test_token';
  const now = 1_800_000_000;
  const make = (over: Record<string, string> = {}) => {
    const f: Record<string, string> = { id: '777', first_name: 'Гар', username: 'gar', auth_date: String(now - 60), ...over };
    f.hash = computeTelegramHash(f, BOT);
    return f;
  };
  it('принимает корректную подпись', () => {
    const r = verifyTelegramLogin(make(), BOT, now);
    expect(r).toMatchObject({ ok: true, user: { id: 777, first_name: 'Гар', username: 'gar' } });
  });
  it('отклоняет изменённые данные, чужой токен, отсутствие hash и устаревший вход', () => {
    const f = make();
    expect(verifyTelegramLogin({ ...f, id: '778' }, BOT, now)).toEqual({ ok: false, reason: 'bad_hash' });
    expect(verifyTelegramLogin(f, 'other:token', now)).toEqual({ ok: false, reason: 'bad_hash' });
    const { hash: _h, ...noHash } = f;
    expect(verifyTelegramLogin(noHash, BOT, now)).toEqual({ ok: false, reason: 'no_hash' });
    expect(verifyTelegramLogin(f, BOT, now + 90_000)).toEqual({ ok: false, reason: 'expired' });
    expect(verifyTelegramLogin(f, '', now)).toEqual({ ok: false, reason: 'no_token' });
  });
  it('совпадает с независимым расчётом по алгоритму Telegram', async () => {
    const crypto = await import('node:crypto');
    const fields = { auth_date: '1', first_name: 'A', id: '5' };
    const secret = crypto.createHash('sha256').update(BOT).digest();
    const expected = crypto.createHmac('sha256', secret).update('auth_date=1\nfirst_name=A\nid=5').digest('hex');
    expect(computeTelegramHash(fields, BOT)).toBe(expected);
  });
});

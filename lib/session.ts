/**
 * Сессия = подписанная cookie (HMAC-SHA256). Без сторонних библиотек.
 * Формат: base64url(JSON{uid,exp}) + '.' + base64url(hmac)
 */
import crypto from 'node:crypto';
import { env } from './env';

export const SESSION_COOKIE = 'dgt_session';
export const SESSION_DAYS = 60;

const b64 = (b: Buffer | string) => Buffer.from(b).toString('base64url');

function mac(payload: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(payload).digest();
}

export function signSession(uid: string, opts: { now?: number; days?: number; secret?: string } = {}): string {
  const now = opts.now ?? Date.now();
  const payload = b64(JSON.stringify({ uid, exp: now + (opts.days ?? SESSION_DAYS) * 86_400_000 }));
  return `${payload}.${b64(mac(payload, opts.secret ?? env.sessionSecret))}`;
}

export function verifySession(token: string | undefined | null, opts: { now?: number; secret?: string } = {}): string | null {
  if (!token) return null;
  const [payload, sig, extra] = token.split('.');
  if (!payload || !sig || extra !== undefined) return null;
  const expected = mac(payload, opts.secret ?? env.sessionSecret);
  let given: Buffer;
  try {
    given = Buffer.from(sig, 'base64url');
  } catch {
    return null;
  }
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  try {
    const { uid, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof uid !== 'string' || typeof exp !== 'number') return null;
    if (exp < (opts.now ?? Date.now())) return null;
    return uid;
  } catch {
    return null;
  }
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_DAYS * 86_400,
};

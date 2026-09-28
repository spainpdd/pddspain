/**
 * Проверка данных Telegram Login Widget.
 * https://core.telegram.org/widgets/login#checking-authorization
 *   secret = SHA256(bot_token)
 *   hash   = HMAC_SHA256(secret, "key=value\n..." отсортированные, без hash)
 */
import crypto from 'node:crypto';
import type { TelegramUser } from './repo/users';

export const TELEGRAM_AUTH_MAX_AGE_SEC = 86_400;

export function computeTelegramHash(fields: Record<string, string>, botToken: string): string {
  const secret = crypto.createHash('sha256').update(botToken).digest();
  const dcs = Object.keys(fields)
    .filter((k) => k !== 'hash')
    .sort()
    .map((k) => `${k}=${fields[k]}`)
    .join('\n');
  return crypto.createHmac('sha256', secret).update(dcs).digest('hex');
}

export type TelegramAuthResult =
  | { ok: true; user: TelegramUser }
  | { ok: false; reason: 'no_token' | 'no_hash' | 'bad_hash' | 'expired' | 'bad_data' };

export function verifyTelegramLogin(
  fields: Record<string, string>,
  botToken: string,
  nowSec = Math.floor(Date.now() / 1000),
): TelegramAuthResult {
  if (!botToken) return { ok: false, reason: 'no_token' };
  const hash = fields.hash;
  if (!hash) return { ok: false, reason: 'no_hash' };
  const expected = computeTelegramHash(fields, botToken);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { ok: false, reason: 'bad_hash' };
  const authDate = Number(fields.auth_date);
  if (!Number.isFinite(authDate) || nowSec - authDate > TELEGRAM_AUTH_MAX_AGE_SEC) return { ok: false, reason: 'expired' };
  const id = Number(fields.id);
  if (!Number.isSafeInteger(id) || id <= 0) return { ok: false, reason: 'bad_data' };
  return {
    ok: true,
    user: {
      id,
      first_name: fields.first_name,
      last_name: fields.last_name,
      username: fields.username,
      photo_url: fields.photo_url,
    },
  };
}

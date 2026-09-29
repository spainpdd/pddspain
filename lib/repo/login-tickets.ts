/**
 * Тикеты для входа через Telegram-бота напрямую (без Login Widget).
 * См. supabase/migrations/003_login_tickets.sql.
 */
import crypto from 'node:crypto';
import { getDb } from '../db';

export const LOGIN_TICKET_TTL_SEC = 600; // 10 минут

export type LoginTicketStatus = 'pending' | 'confirmed' | 'expired';

export interface LoginTicket {
  token: string;
  status: 'pending' | 'confirmed';
  telegram_id: number | null;
}

/** Создаёт новый тикет и возвращает его токен (URL-safe, годится для /start-payload Telegram: [A-Za-z0-9_-], ≤64 симв.) */
export async function createLoginTicket(): Promise<string> {
  const token = crypto.randomBytes(16).toString('base64url');
  const db = await getDb();
  await db.query(
    `insert into login_tickets (token, expires_at) values ($1, now() + ($2 || ' seconds')::interval)`,
    [token, LOGIN_TICKET_TTL_SEC],
  );
  return token;
}

/** Вызывается ботом при /start login_<token>. Возвращает true, если тикет найден, ещё не подтверждён и не истёк. */
export async function confirmLoginTicket(token: string, telegramId: number): Promise<boolean> {
  const db = await getDb();
  const rows = await db.query(
    `update login_tickets set status = 'confirmed', telegram_id = $2, confirmed_at = now()
     where token = $1 and status = 'pending' and expires_at > now()
     returning token`,
    [token, telegramId],
  );
  return rows.length > 0;
}

/** Для поллинга со страницы входа. Возвращает null для неизвестного токена — не отличаем от истёкшего, чтобы не давать лишней информации. */
export async function getLoginTicket(token: string): Promise<LoginTicket | null> {
  const db = await getDb();
  const rows = await db.query<{ token: string; status: string; telegram_id: number | null }>(
    `select token, status, telegram_id from login_tickets where token = $1 and expires_at > now()`,
    [token],
  );
  const r = rows[0];
  if (!r) return null;
  return { token: r.token, status: r.status as 'pending' | 'confirmed', telegram_id: r.telegram_id };
}

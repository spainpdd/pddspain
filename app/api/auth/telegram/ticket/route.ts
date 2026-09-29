import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { createLoginTicket } from '@/lib/repo/login-tickets';

export const dynamic = 'force-dynamic';

/** Создаёт тикет для входа через бота напрямую. Клиент переходит на botUrl и поллит GET .../ticket/[token]. */
export async function POST() {
  if (!env.botUsername) return NextResponse.json({ error: 'bot not configured' }, { status: 500 });
  const token = await createLoginTicket();
  return NextResponse.json({ token, botUrl: `https://t.me/${env.botUsername}?start=login_${token}` });
}

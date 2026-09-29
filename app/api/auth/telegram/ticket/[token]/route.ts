import { NextResponse } from 'next/server';
import { getLoginTicket } from '@/lib/repo/login-tickets';
import { getProfileByTelegramId } from '@/lib/repo/users';
import { SESSION_COOKIE, cookieOptions, signSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** Поллинг со страницы входа. Когда тикет подтверждён ботом — выставляет cookie сессии прямо в ответе. */
export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const ticket = await getLoginTicket(params.token);
  if (!ticket) return NextResponse.json({ status: 'expired' });
  if (ticket.status !== 'confirmed' || !ticket.telegram_id) return NextResponse.json({ status: ticket.status });

  const profile = await getProfileByTelegramId(ticket.telegram_id);
  if (!profile) return NextResponse.json({ status: 'pending' }); // защитный случай: не должен произойти

  const res = NextResponse.json({ status: 'confirmed' });
  res.cookies.set(SESSION_COOKIE, signSession(profile.id), cookieOptions);
  return res;
}

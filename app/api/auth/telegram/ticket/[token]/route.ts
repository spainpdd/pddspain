import { NextResponse } from 'next/server';
import { getProfile } from '@/lib/repo/users';
import { resolveLoginTicket } from '@/lib/repo/login-tickets';
import { SESSION_COOKIE, cookieOptions, signSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** Поллинг со страницы входа. Когда тикет подтверждён ботом — выставляет cookie сессии прямо в ответе. */
export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const r = await resolveLoginTicket(params.token);
  if (r.status !== 'confirmed') return NextResponse.json({ status: r.status });
  if ((await getProfile(r.profileId))?.blocked_at) return NextResponse.json({ status: 'blocked' });
  const res = NextResponse.json({ status: 'confirmed' });
  res.cookies.set(SESSION_COOKIE, signSession(r.profileId), cookieOptions);
  return res;
}

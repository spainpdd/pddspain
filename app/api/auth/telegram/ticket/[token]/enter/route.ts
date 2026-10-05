import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { resolveLoginTicket } from '@/lib/repo/login-tickets';
import { SESSION_COOKIE, cookieOptions, signSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * Ссылка из кнопки «Открыть приложение» в сообщении бота о подтверждённом входе.
 * Telegram открывает её в своём встроенном браузере (или в браузере по умолчанию на ПК) —
 * там нет cookie со страницы входа, поэтому выдаём сессию и здесь (действует, пока жив тикет — 10 минут).
 */
export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const r = await resolveLoginTicket(params.token);
  if (r.status !== 'confirmed') return NextResponse.redirect(new URL('/login', env.siteUrl));
  const res = NextResponse.redirect(new URL('/dashboard', env.siteUrl));
  res.cookies.set(SESSION_COOKIE, signSession(r.profileId), cookieOptions);
  return res;
}

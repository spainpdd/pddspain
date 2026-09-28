import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { verifyTelegramLogin } from '@/lib/telegram-auth';
import { upsertTelegramUser } from '@/lib/repo/users';
import { SESSION_COOKIE, cookieOptions, signSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** Возврат из Telegram Login Widget (data-auth-url): проверяем подпись, создаём сессию */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const fields: Record<string, string> = {};
  url.searchParams.forEach((v, k) => (fields[k] = v));
  const r = verifyTelegramLogin(fields, env.botToken);
  const back = (q: string) => NextResponse.redirect(new URL(`/login?error=${q}`, env.siteUrl));
  if (!r.ok) return back(r.reason);

  const profile = await upsertTelegramUser(r.user);
  const res = NextResponse.redirect(new URL('/dashboard', env.siteUrl));
  res.cookies.set(SESSION_COOKIE, signSession(profile.id), cookieOptions);
  return res;
}

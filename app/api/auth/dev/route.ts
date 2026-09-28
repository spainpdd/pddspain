import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { upsertTelegramUser } from '@/lib/repo/users';
import { SESSION_COOKIE, cookieOptions, signSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** Вход без Telegram — ТОЛЬКО при ENABLE_DEV_LOGIN=true (локальная разработка и тесты) */
export async function POST(req: Request) {
  if (!env.devLogin) return NextResponse.json({ error: 'disabled' }, { status: 404 });
  const form = await req.formData().catch(() => null);
  const id = Number(form?.get('id') ?? 9001);
  const name = String(form?.get('name') ?? 'Dev User').slice(0, 60);
  if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: 'bad id' }, { status: 400 });
  const profile = await upsertTelegramUser({ id, first_name: name, username: `dev${id}` });
  const res = NextResponse.redirect(new URL('/dashboard', req.url), 303);
  res.cookies.set(SESSION_COOKIE, signSession(profile.id), cookieOptions);
  return res;
}

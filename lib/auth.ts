import 'server-only';
import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, verifySession } from './session';
import { getProfile } from './repo/users';
import { getTodayFreeTest } from './repo/progress';
import { hasPaidAccess } from './engine';
import type { Profile } from './types';

/** Текущий пользователь (или null). Кэшируется в пределах одного запроса. */
export const getSessionUser = cache(async (): Promise<Profile | null> => {
  const uid = verifySession(cookies().get(SESSION_COOKIE)?.value);
  return uid ? getProfile(uid) : null;
});

export async function requireUser(): Promise<Profile> {
  const u = await getSessionUser();
  if (!u) redirect('/login');
  return u;
}

export async function requireAdmin(): Promise<Profile> {
  const u = await requireUser();
  if (!u.is_admin) redirect('/dashboard');
  return u;
}

export async function accessInfo(p: Profile) {
  const paid = hasPaidAccess(p.access_until);
  const daysLeft = paid ? Math.ceil((new Date(p.access_until!).getTime() - Date.now()) / 86_400_000) : 0;
  const todayFreeTest = paid ? null : await getTodayFreeTest(p.id);
  return { paid, daysLeft, todayFreeTest };
}

/** Защита от CSRF для изменяющих запросов: Origin должен совпадать с Host */
export function sameOrigin(): boolean {
  const h = headers();
  const origin = h.get('origin');
  if (!origin) return true; // не-браузерные клиенты (curl, вебхуки) не шлют Origin; куки у них всё равно нет
  try {
    return new URL(origin).host === h.get('host');
  } catch {
    return false;
  }
}

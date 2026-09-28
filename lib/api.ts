import 'server-only';
import { NextResponse } from 'next/server';
import { getSessionUser, sameOrigin } from './auth';
import type { Profile } from './types';

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const fail = (status: number, error: string, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ error, ...extra }, { status });

/** Пользователь для API-роута или готовый ответ 401/403 */
export async function apiUser(opts: { mutating?: boolean; admin?: boolean } = {}): Promise<{ user: Profile } | { res: NextResponse }> {
  if (opts.mutating && !sameOrigin()) return { res: fail(403, 'bad_origin') };
  const user = await getSessionUser();
  if (!user) return { res: fail(401, 'unauthorized') };
  if (opts.admin && !user.is_admin) return { res: fail(403, 'forbidden') };
  return { user };
}

export async function readJson<T = any>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

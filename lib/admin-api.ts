import 'server-only';
import { apiUser, fail } from './api';
import { ValidationError } from './repo/admin';

/** Оборачивает админский API-роут: проверка прав + единый разбор ошибок валидации */
export async function adminRoute(opts: { mutating?: boolean }, fn: (admin: import('./types').Profile) => Promise<Response>): Promise<Response> {
  const a = await apiUser({ mutating: opts.mutating ?? true, admin: true });
  if ('res' in a) return a.res;
  try {
    return await fn(a.user);
  } catch (e) {
    if (e instanceof ValidationError) return fail(422, e.message);
    console.error('admin api error', e);
    return fail(500, 'server_error');
  }
}

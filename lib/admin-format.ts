/** Форматирование для админки */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
}

export function formatRub(n: number | null | undefined): string {
  return `${Math.round(n ?? 0).toLocaleString('ru-RU')} ₽`;
}

export function formatMoneyCode(n: number, code: string): string {
  if (code === 'RUB') return formatRub(n);
  const sym = ({ EUR: '€', AMD: '֏', USD: '$' } as Record<string, string>)[code] ?? code;
  return `${n.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ${sym}`;
}

/** «5 мин назад», «вчера», «3 дн. назад» — для «последний визит» */
export function timeAgo(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return '—';
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 90) return 'только что';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} мин назад`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} ч назад`;
  const d = Math.round(h / 24);
  if (d === 1) return 'вчера';
  if (d < 60) return `${d} дн. назад`;
  return formatDateOnly(iso);
}

export function formatDateOnly(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Madrid' });
}

export type AccessState = 'active' | 'expiring' | 'expired' | 'never';

export function accessState(until: string | null | undefined, now = Date.now()): AccessState {
  if (!until) return 'never';
  const t = new Date(until).getTime();
  if (t <= now) return 'expired';
  return t - now <= 7 * 86_400_000 ? 'expiring' : 'active';
}

export const ACCESS_LABEL: Record<AccessState, string> = {
  active: 'Активен',
  expiring: 'Скоро закончится',
  expired: 'Закончился',
  never: 'Не было',
};

export const userLabel = (u: { display_name: string | null; telegram_username: string | null; telegram_id?: number }) =>
  u.display_name || (u.telegram_username ? `@${u.telegram_username}` : u.telegram_id ? `id${u.telegram_id}` : 'без имени');

/** Строка запроса из объекта: пустые значения пропускаются */
export function qs(params: Record<string, string | number | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  const s = sp.toString();
  return s ? `?${s}` : '';
}

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Content, Lang, PlayerQuestion } from './types';
import type { Pricing } from './repo/config';
import { formatMoney, type ShowCurrency } from './currency';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Текст вопроса на языке; если перевода нет — испанский оригинал */
export function pick(q: PlayerQuestion, lang: Lang): Content | null {
  return q.i18n[lang] ?? q.i18n.es ?? null;
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Madrid' });
}

/** Цена для отображения в выбранной валюте (см. lib/currency.ts) */
export function formatPrice(p: Pricing, cur: ShowCurrency = 'EUR'): string {
  return formatMoney(p, cur);
}

export function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

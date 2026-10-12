/**
 * Тарифы доступа. Это не автоподписка: пользователь платит один раз за выбранный срок,
 * а когда доступ заканчивается — оплачивает снова (Prodamus видит обычные разовые платежи).
 * Гарантия «не сдали с первого раза — +30 дней» действует только на тарифе с guarantee = true.
 */
import type { Pricing } from './repo/config';
import type { ShowCurrency } from './currency';

export type PlanId = 'week' | 'm2' | 'd100';

export interface Plan {
  id: PlanId;
  days: number;
  /** Название в интерфейсе */
  title: string;
  guarantee: boolean;
}

export const PLANS: readonly Plan[] = [
  { id: 'week', days: 7, title: '7 дней', guarantee: false },
  { id: 'm2', days: 60, title: '2 месяца', guarantee: false },
  { id: 'd100', days: 100, title: '100 дней', guarantee: true },
];

export const DEFAULT_PLAN: PlanId = 'd100';

export function isPlanId(x: unknown): x is PlanId {
  return x === 'week' || x === 'm2' || x === 'd100';
}

export function getPlan(id: unknown): Plan | null {
  return PLANS.find((p) => p.id === id) ?? null;
}

/** Цены по умолчанию для коротких тарифов (100 дней живёт в основной записи цен). Курс как у основного тарифа: 1 € = 100 ₽ */
export const DEFAULT_SHORT_PRICES: Record<'week' | 'm2', Pricing> = {
  week: { eur_cents: 1000, rub: 1000, amd: 4900 },
  m2: { eur_cents: 3500, rub: 3500, amd: 17100 },
};

/** Сколько стоит день доступа: «0,49 €», «143 ₽», «700 ֏» */
export function perDayAmount(p: Pricing, days: number, cur: ShowCurrency): string {
  if (cur === 'RUB') return `${Math.round(p.rub / days).toLocaleString('ru-RU')} ₽`;
  if (cur === 'AMD') return `${Math.round(p.amd / days).toLocaleString('ru-RU')} ֏`;
  return `${(p.eur_cents / 100 / days).toFixed(2).replace('.', ',')} €`;
}

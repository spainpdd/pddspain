/**
 * В какой валюте показываем цену. Списание ВСЕГДА в рублях (платёжный сервис принимает только рубли),
 * поэтому евро и драмы — пересчёт для удобства: итоговая сумма в валюте карты зависит от курса банка.
 *   Армения → драмы; Россия, Беларусь, Казахстан → рубли; остальной мир (Европа и др.) → евро.
 * Страна определяется по заголовку хостинга (x-vercel-ip-country); если его нет — по языку интерфейса
 * (армянский → драмы, иначе евро).
 */
import type { Pricing } from './repo/config';

export type ShowCurrency = 'EUR' | 'RUB' | 'AMD';

const RUB_COUNTRIES = new Set(['RU', 'BY', 'KZ']);

export function currencyForCountry(country: string | null | undefined, lang?: string | null): ShowCurrency {
  const c = (country ?? '').trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(c) && c !== 'XX' && c !== 'T1') {
    if (c === 'AM') return 'AMD';
    if (RUB_COUNTRIES.has(c)) return 'RUB';
    return 'EUR';
  }
  return lang === 'hy' ? 'AMD' : 'EUR';
}

export function formatMoney(p: Pricing, cur: ShowCurrency): string {
  if (cur === 'RUB') return `${p.rub.toLocaleString('ru-RU')} ₽`;
  if (cur === 'AMD') return `${p.amd.toLocaleString('ru-RU')} ֏`;
  return `${Math.round(p.eur_cents / 100)} €`;
}

/** Число, которое человек видел на странице (для журнала счёта) */
export function shownAmount(p: Pricing, cur: ShowCurrency): number {
  if (cur === 'RUB') return p.rub;
  if (cur === 'AMD') return p.amd;
  return p.eur_cents / 100;
}

/** Пояснение про рубли для тех, кому показана не рублёвая цена; для рублей — null */
export function chargeNote(p: Pricing, cur: ShowCurrency): string | null {
  if (cur === 'RUB') return null;
  return `Платёж проходит в рублях: будет списано ${p.rub.toLocaleString('ru-RU')} ₽. Ваш банк пересчитает их в валюту карты по своему курсу, поэтому итоговая сумма может немного отличаться от указанной.`;
}

import 'server-only';
import { headers } from 'next/headers';
import { currencyForCountry, type ShowCurrency } from './currency';

/** Валюта показа цены для текущего запроса (страна — по заголовку Vercel) */
export function getDisplayCurrency(lang?: string | null): ShowCurrency {
  return currencyForCountry(headers().get('x-vercel-ip-country'), lang);
}

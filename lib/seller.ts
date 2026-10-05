/**
 * Данные продавца (самозанятого). Показываются на юридических страницах и мелким шрифтом в самом низу лендинга.
 * Значения по умолчанию — реквизиты владельца; при необходимости их можно переопределить
 * переменными SELLER_INN, SELLER_EMAIL, SELLER_PHONE в настройках Vercel (без правки кода).
 */
const DEFAULT_INN = '611407151752';
const DEFAULT_EMAIL = 'spainpdd@gmail.com';
const DEFAULT_PHONE = '+7 928 144-48-51';

export const SELLER_NAME = 'Катанян Гарник Гургенович';
export const SELLER_STATUS = 'самозанятый (плательщик налога на профессиональный доход)';
export const SERVICE_NAME = 'DGT Права';
/** Адрес сайта для юридических текстов (не зависит от настроек окружения) */
export const LEGAL_SITE_URL = 'https://pravaes.app';
export const LEGAL_DATE = '5 октября 2026 г.';

export function sellerInn(): string {
  return (process.env.SELLER_INN || '').trim() || DEFAULT_INN;
}

export function sellerEmail(): string {
  return (process.env.SELLER_EMAIL || '').trim() || DEFAULT_EMAIL;
}

export function sellerPhone(): string {
  return (process.env.SELLER_PHONE || '').trim() || DEFAULT_PHONE;
}

/** Одна строка для низа лендинга */
export function sellerLine(): string {
  return `${SELLER_STATUS.split(' (')[0]} ${SELLER_NAME}, ИНН ${sellerInn()}, ${sellerPhone()}, ${sellerEmail()}`;
}

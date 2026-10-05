import { describe, it, expect } from 'vitest';
import { chargeNote, currencyForCountry, formatMoney, shownAmount } from '../lib/currency';
import { DEFAULT_PRICING } from '../lib/repo/config';

describe('валюта показа цены', () => {
  it('Армения — драмы, РФ/Беларусь/Казахстан — рубли, остальные (Испания и др.) — евро', () => {
    expect(currencyForCountry('AM')).toBe('AMD');
    expect(currencyForCountry('ru')).toBe('RUB');
    expect(currencyForCountry('BY')).toBe('RUB');
    expect(currencyForCountry('ES')).toBe('EUR');
    expect(currencyForCountry('DE')).toBe('EUR');
    expect(currencyForCountry('US')).toBe('EUR');
  });
  it('страна важнее языка; без страны — армянский язык даёт драмы, иначе евро', () => {
    expect(currencyForCountry('ES', 'hy')).toBe('EUR');
    expect(currencyForCountry(null, 'hy')).toBe('AMD');
    expect(currencyForCountry(undefined, 'ru')).toBe('EUR');
    expect(currencyForCountry('XX', 'ru')).toBe('EUR');
    expect(currencyForCountry('', null)).toBe('EUR');
  });
  it('форматирование и сумма для журнала', () => {
    const p = { eur_cents: 4900, rub: 4900, amd: 23900 };
    expect(formatMoney(p, 'EUR')).toBe('49 €');
    expect(formatMoney(p, 'RUB')).toMatch(/^4\s?900 ₽$/);
    expect(formatMoney(p, 'AMD')).toMatch(/^23\s?900 ֏$/);
    expect(shownAmount(p, 'EUR')).toBe(49);
    expect(shownAmount(p, 'RUB')).toBe(4900);
    expect(shownAmount(p, 'AMD')).toBe(23900);
    expect(DEFAULT_PRICING.rub).toBeGreaterThan(0);
  });
  it('пояснение про рубли: для евро и драм есть, для рублей нет', () => {
    const p = { eur_cents: 4900, rub: 4900, amd: 23900 };
    expect(chargeNote(p, 'RUB')).toBeNull();
    expect(chargeNote(p, 'EUR')).toMatch(/списано 4\s?900 ₽/);
    expect(chargeNote(p, 'AMD')).toMatch(/рубл/);
  });
});

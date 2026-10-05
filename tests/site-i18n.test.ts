import { describe, it, expect } from 'vitest';
import { COOKIE, LANDING, LOGIN, langFromAcceptLanguage, normalizeLang } from '../lib/site-i18n';

describe('язык публичных страниц', () => {
  it('normalizeLang принимает только ru/hy', () => {
    expect(normalizeLang('hy')).toBe('hy');
    expect(normalizeLang('ru')).toBe('ru');
    expect(normalizeLang('en')).toBeNull();
    expect(normalizeLang(undefined)).toBeNull();
  });
  it('Accept-Language: hy → армянский, остальное → русский', () => {
    expect(langFromAcceptLanguage('hy-AM,hy;q=0.9,en;q=0.8')).toBe('hy');
    expect(langFromAcceptLanguage('ru-RU,ru;q=0.9')).toBe('ru');
    expect(langFromAcceptLanguage('es-ES')).toBe('ru');
    expect(langFromAcceptLanguage(null)).toBe('ru');
  });
  it('словари ru и hy полные и одинаковой структуры', () => {
    expect(Object.keys(LANDING.hy)).toEqual(Object.keys(LANDING.ru));
    expect(LANDING.hy.features).toHaveLength(LANDING.ru.features.length);
    expect(LANDING.hy.priceList).toHaveLength(LANDING.ru.priceList.length);
    expect(Object.keys(LOGIN.hy)).toEqual(Object.keys(LOGIN.ru));
    expect(Object.keys(COOKIE.hy)).toEqual(Object.keys(COOKIE.ru));
    expect(Object.keys(LOGIN.hy.tg)).toEqual(Object.keys(LOGIN.ru.tg));
    // в армянской версии не должно остаться русских строк
    const hyText = JSON.stringify([LANDING.hy, LOGIN.hy, COOKIE.hy]);
    expect(hyText).not.toMatch(/[А-Яа-яЁё]/);
  });
});

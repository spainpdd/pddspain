import { describe, it, expect } from 'vitest';
import { buildPayUrl, canonicalJson, formatRub, nestPairs, normalizeFormUrl, parseSumKopecks, signPayload, verifyPayload } from '../lib/prodamus';

const SECRET = 'test_secret_key';
// Эталонные векторы из официального репозитория Prodamus (integration-expert, references/hmac.md)
const V1 = { order_id: '12345', sum: '1000.00', customer_email: 'client@example.com', payment_status: 'success' };
const V2 = {
  order_id: 'order-77', sum: '2500.50',
  products: [{ name: 'Тестовый курс «Запуск»', price: '2500.50', quantity: '1' }],
  urlNotification: 'https://example.com/webhook/prodamus',
};

describe('подпись Prodamus', () => {
  it('вектор 1: плоские данные', () => {
    expect(canonicalJson(V1)).toBe('{"customer_email":"client@example.com","order_id":"12345","payment_status":"success","sum":"1000.00"}');
    expect(signPayload(V1, SECRET)).toBe('a0c2f61457c981288d7687765a069d5e8db5b6998706115fb0c0de0988620609');
  });

  it('вектор 2: вложенные данные, кириллица, слэши', () => {
    expect(canonicalJson(V2)).toBe(
      '{"order_id":"order-77","products":[{"name":"Тестовый курс «Запуск»","price":"2500.50","quantity":"1"}],"sum":"2500.50","urlNotification":"https:\\/\\/example.com\\/webhook\\/prodamus"}',
    );
    expect(signPayload(V2, SECRET)).toBe('ca54bade5070ec36f00dd966aea69bd84f5bdc89632b8f3d25c93f57340628c5');
  });

  it('числа и null приводятся к строкам; порядок ключей не важен', () => {
    expect(signPayload({ b: 1, a: null }, SECRET)).toBe(signPayload({ a: '', b: '1' }, SECRET));
  });

  it('verify: верная подпись проходит, поля подписи игнорируются, чужой ключ и порча — нет', () => {
    const sig = signPayload(V1, SECRET);
    expect(verifyPayload({ ...V1, sign: 'x', signature: 'y' }, sig, [SECRET])).toBe(true);
    expect(verifyPayload(V1, sig.toUpperCase(), [SECRET])).toBe(true);
    expect(verifyPayload(V1, sig, ['other'])).toBe(false);
    expect(verifyPayload(V1, sig, ['other', SECRET])).toBe(true);
    expect(verifyPayload({ ...V1, sum: '1.00' }, sig, [SECRET])).toBe(false);
    expect(verifyPayload(V1, '', [SECRET])).toBe(false);
    expect(verifyPayload(V1, 'zz', [SECRET])).toBe(false);
    expect(verifyPayload(V1, sig, [''])).toBe(false);
    expect(verifyPayload(V1, sig, [])).toBe(false);
  });
});

describe('разбор тела уведомления', () => {
  it('products[0][name] → массив объектов, подпись совпадает с вектором 2', () => {
    const body = new URLSearchParams();
    body.set('order_id', 'order-77');
    body.set('sum', '2500.50');
    body.set('products[0][name]', 'Тестовый курс «Запуск»');
    body.set('products[0][price]', '2500.50');
    body.set('products[0][quantity]', '1');
    body.set('urlNotification', 'https://example.com/webhook/prodamus');
    const data = nestPairs(body.entries());
    expect(Array.isArray(data.products)).toBe(true);
    expect(signPayload(data, SECRET)).toBe('ca54bade5070ec36f00dd966aea69bd84f5bdc89632b8f3d25c93f57340628c5');
  });

  it('защита от __proto__ и мусорных ключей', () => {
    const d = nestPairs([['__proto__[x]', '1'], ['a[b][c]', '2'], ['bad[', '3']]);
    expect(({} as any).x).toBeUndefined();
    expect(d).toEqual({ a: { b: { c: '2' } } });
  });
});

describe('вспомогательное', () => {
  it('суммы', () => {
    expect(formatRub(490000)).toBe('4900.00');
    expect(formatRub(5)).toBe('0.05');
    expect(() => formatRub(0)).toThrow();
    expect(parseSumKopecks('4900.00')).toBe(490000);
    expect(parseSumKopecks('4900,5')).toBe(490050);
    expect(parseSumKopecks('abc')).toBeNull();
    expect(parseSumKopecks('-1')).toBeNull();
  });

  it('адрес формы: только домены Prodamus', () => {
    expect(normalizeFormUrl('https://shop.payform.ru/')).toBe('https://shop.payform.ru');
    expect(normalizeFormUrl('Shop.PayForm.ru')).toBe('https://shop.payform.ru');
    expect(normalizeFormUrl('shop.prodamus.ru')).toBe('https://shop.prodamus.ru');
    expect(normalizeFormUrl('evil.com')).toBeNull();
    expect(normalizeFormUrl('shop.payform.ru.evil.com')).toBeNull();
    expect(normalizeFormUrl('user@shop.payform.ru')).toBeNull();
    expect(normalizeFormUrl('shop.payform.ru/path')).toBeNull();
    expect(normalizeFormUrl('')).toBeNull();
  });

  it('ссылка: вложенные параметры в query и подпись, которая проходит проверку', () => {
    const url = new URL(buildPayUrl('https://shop.payform.ru', { do: 'pay', order_id: '10001', products: [{ name: 'Доступ', price: '4900.00', quantity: '1' }] }, SECRET));
    expect(url.origin).toBe('https://shop.payform.ru');
    expect(url.searchParams.get('products[0][name]')).toBe('Доступ');
    const sig = url.searchParams.get('signature')!;
    const back = nestPairs([...url.searchParams.entries()].filter(([k]) => k !== 'signature'));
    expect(verifyPayload(back, sig, [SECRET])).toBe(true);
    expect(new URL(buildPayUrl('https://shop.payform.ru', { order_id: '1' })).searchParams.has('signature')).toBe(false);
  });
});

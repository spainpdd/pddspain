import { describe, it, expect } from 'vitest';
import {
  buildPaymentUrl, cleanDescription, formatOutSum, hashHex, normalizeAlgo, parseOutSum,
  paymentSignatureBase, pickShp, resultAck, signPayment, verifyResultSignature, verifySuccessSignature,
} from '../lib/robokassa';

describe('Robokassa: подпись', () => {
  it('строка подписи совпадает с примерами из документации', () => {
    expect(paymentSignatureBase({ login: 'demo', outSum: '990.00', invId: 12, password: 'password_1' })).toBe('demo:990.00:12:password_1');
    expect(
      paymentSignatureBase({ login: 'demo', outSum: '8.96', invId: 12345, password: 'password_1', receipt: '{"a":1}', shp: { Shp_item: 'digital' } }),
    ).toBe('demo:8.96:12345:{"a":1}:password_1:Shp_item=digital');
  });

  it('Shp_* сортируются по алфавиту', () => {
    expect(paymentSignatureBase({ login: 'l', outSum: '1.00', invId: 1, password: 'p', shp: { Shp_b: '2', Shp_a: '1' } })).toBe('l:1.00:1:p:Shp_a=1:Shp_b=2');
  });

  it('хеш: md5 и sha256', () => {
    expect(hashHex('demo:990.00:12:password_1', 'md5')).toMatch(/^[0-9a-f]{32}$/);
    expect(hashHex('demo:990.00:12:password_1', 'sha256')).toMatch(/^[0-9a-f]{64}$/);
    expect(signPayment({ login: 'demo', outSum: '990.00', invId: 12, password: 'password_1' }, 'md5')).toBe(hashHex('demo:990.00:12:password_1', 'md5'));
    expect(normalizeAlgo('SHA-256')).toBe('sha256');
    expect(normalizeAlgo('что-то')).toBe('md5');
  });
});

describe('Robokassa: суммы', () => {
  it('formatOutSum', () => {
    expect(formatOutSum(490000)).toBe('4900.00');
    expect(formatOutSum(5)).toBe('0.05');
    expect(() => formatOutSum(0)).toThrow();
    expect(() => formatOutSum(10.5)).toThrow();
  });
  it('parseOutSum понимает формат уведомлений и отвергает мусор', () => {
    expect(parseOutSum('4900.000000')).toBe(490000);
    expect(parseOutSum('4900')).toBe(490000);
    expect(parseOutSum('49.5')).toBe(4950);
    expect(parseOutSum('49.005')).toBeNull();
    expect(parseOutSum('-5')).toBeNull();
    expect(parseOutSum('abc')).toBeNull();
    expect(parseOutSum('')).toBeNull();
    expect(parseOutSum(undefined)).toBeNull();
  });
});

describe('Robokassa: проверка уведомлений', () => {
  const sigResult = (out: string, inv: string, p2: string) => hashHex(`${out}:${inv}:${p2}`, 'md5');
  it('ResultURL проверяется паролем #2, регистр хеша не важен', () => {
    const s = sigResult('4900.000000', '10001', 'secret2');
    expect(verifyResultSignature({ outSum: '4900.000000', invId: '10001', signature: s }, 'secret2', 'md5')).toBe(true);
    expect(verifyResultSignature({ outSum: '4900.000000', invId: '10001', signature: s.toUpperCase() }, 'secret2', 'md5')).toBe(true);
  });
  it('неверный пароль, сумма, номер или пустая подпись — отказ', () => {
    const s = sigResult('4900.000000', '10001', 'secret2');
    expect(verifyResultSignature({ outSum: '4900.000000', invId: '10001', signature: s }, 'other', 'md5')).toBe(false);
    expect(verifyResultSignature({ outSum: '1.000000', invId: '10001', signature: s }, 'secret2', 'md5')).toBe(false);
    expect(verifyResultSignature({ outSum: '4900.000000', invId: '10002', signature: s }, 'secret2', 'md5')).toBe(false);
    expect(verifyResultSignature({ outSum: '4900.000000', invId: '10001', signature: '' }, 'secret2', 'md5')).toBe(false);
    expect(verifyResultSignature({ outSum: '4900.000000', invId: '10001', signature: 'abc' }, 'secret2', 'md5')).toBe(false);
  });
  it('SuccessURL — паролем #1, а подпись ResultURL на нём не проходит', () => {
    const s = hashHex('4900.000000:10001:secret1', 'sha256');
    expect(verifySuccessSignature({ outSum: '4900.000000', invId: '10001', signature: s }, 'secret1', 'sha256')).toBe(true);
    expect(verifyResultSignature({ outSum: '4900.000000', invId: '10001', signature: s }, 'secret1', 'sha256')).toBe(true); // тот же пароль → тот же хеш: пароли в env обязаны быть разными
    expect(verifyResultSignature({ outSum: '4900.000000', invId: '10001', signature: s }, 'secret2', 'sha256')).toBe(false);
  });
  it('Shp_* участвуют в подписи уведомления', () => {
    const s = hashHex('1.000000:7:p2:Shp_a=1', 'md5');
    expect(verifyResultSignature({ outSum: '1.000000', invId: '7', signature: s, shp: { Shp_a: '1' } }, 'p2', 'md5')).toBe(true);
    expect(verifyResultSignature({ outSum: '1.000000', invId: '7', signature: s }, 'p2', 'md5')).toBe(false);
  });
  it('resultAck и pickShp', () => {
    expect(resultAck(450009)).toBe('OK450009');
    expect(pickShp(new URLSearchParams('OutSum=1&Shp_b=2&shp_a=1&InvId=3'))).toEqual({ Shp_b: '2', shp_a: '1' });
  });
});

describe('Robokassa: ссылка на оплату', () => {
  it('собирает ссылку с подписью и тестовым флагом', () => {
    const url = new URL(
      buildPaymentUrl({ login: 'pddspain', password1: 'p1', algo: 'md5', kopecks: 490000, invId: '10001', description: 'DGT Права: доступ на 100 дней', isTest: true }),
    );
    expect(url.origin + url.pathname).toBe('https://auth.robokassa.ru/Merchant/Index.aspx');
    expect(url.searchParams.get('OutSum')).toBe('4900.00');
    expect(url.searchParams.get('InvId')).toBe('10001');
    expect(url.searchParams.get('IsTest')).toBe('1');
    expect(url.searchParams.get('SignatureValue')).toBe(hashHex('pddspain:4900.00:10001:p1', 'md5'));
  });
  it('без IsTest в боевом режиме; описание чистится и обрезается', () => {
    const url = new URL(buildPaymentUrl({ login: 'a', password1: 'p', algo: 'sha256', kopecks: 100, invId: 1, description: '<b>x</b> & "y" ' + 'я'.repeat(200) }));
    expect(url.searchParams.has('IsTest')).toBe(false);
    expect(url.searchParams.get('Description')!.length).toBeLessThanOrEqual(100);
    expect(url.searchParams.get('Description')).not.toMatch(/[<>&"]/);
    expect(cleanDescription('a   b')).toBe('a b');
  });
});

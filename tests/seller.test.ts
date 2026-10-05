import { describe, it, expect, afterEach } from 'vitest';
import { sellerEmail, sellerInn, sellerLine, sellerPhone, SELLER_NAME } from '../lib/seller';

describe('данные продавца', () => {
  const keys = ['SELLER_INN', 'SELLER_EMAIL', 'SELLER_PHONE'] as const;
  const old = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  afterEach(() => {
    for (const k of keys) {
      if (old[k] === undefined) delete process.env[k];
      else process.env[k] = old[k];
    }
  });

  it('переменные окружения переопределяют значения по умолчанию', () => {
    process.env.SELLER_INN = ' 123456789012 ';
    process.env.SELLER_EMAIL = 'help@example.test';
    process.env.SELLER_PHONE = '+34 600 000 000';
    expect(sellerInn()).toBe('123456789012');
    expect(sellerEmail()).toBe('help@example.test');
    const line = sellerLine();
    expect(line).toContain(SELLER_NAME);
    expect(line).toContain('123456789012');
    expect(line).toContain('+34 600 000 000');
    expect(line).toContain('help@example.test');
  });

  it('без переменных — реквизиты владельца по умолчанию, пустоты и плейсхолдеров нет', () => {
    for (const k of keys) delete process.env[k];
    expect(sellerInn()).toBe('611407151752');
    expect(sellerEmail()).toBe('spainpdd@gmail.com');
    expect(sellerPhone()).toBe('+7 928 144-48-51');
    expect(sellerLine()).not.toMatch(/\[|SELLER_/);
  });
});

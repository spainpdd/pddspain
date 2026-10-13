import { describe, expect, it } from 'vitest';
import { decodeEscapes } from '../lib/telegram';

describe('decodeEscapes: буквальные \\uXXXX в тексте превращаются в символы', () => {
  it('пара суррогатов → эмодзи', () => {
    expect(decodeEscapes('\\uD83D\\uDCDA Из раздела «Полезно»')).toBe('📚 Из раздела «Полезно»');
  });
  it('регистр букв не важен, форма \\u{…} тоже работает', () => {
    expect(decodeEscapes('\\ud83d\\udcda и \\u{1F4DA}')).toBe('📚 и 📚');
  });
  it('обычный текст и настоящие эмодзи не трогаются', () => {
    expect(decodeEscapes('✅ Верно! Ответ: B')).toBe('✅ Верно! Ответ: B');
  });
  it('некорректная последовательность остаётся как есть', () => {
    expect(decodeEscapes('\\uZZZZ и \\u{110000}')).toBe('\\uZZZZ и \\u{110000}');
  });
});

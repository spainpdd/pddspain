import { describe, it, expect } from 'vitest';
import { applyThemeScript, isNightHour, normalizePref, resolveTheme, THEME_KEY } from '../lib/theme';

describe('тёмная тема', () => {
  it('ночь с 21:00 до 07:00', () => {
    for (const h of [21, 22, 23, 0, 1, 6]) expect(isNightHour(h)).toBe(true);
    for (const h of [7, 8, 12, 18, 20]) expect(isNightHour(h)).toBe(false);
  });

  it('режимы: авто зависит от часа, светлая и тёмная — нет', () => {
    expect(resolveTheme('auto', 21)).toBe('dark');
    expect(resolveTheme('auto', 20)).toBe('light');
    expect(resolveTheme('auto', 7)).toBe('light');
    expect(resolveTheme('light', 23)).toBe('light');
    expect(resolveTheme('dark', 12)).toBe('dark');
  });

  it('нормализация сохранённого значения', () => {
    expect(normalizePref('dark')).toBe('dark');
    expect(normalizePref('light')).toBe('light');
    expect(normalizePref('auto')).toBe('auto');
    expect(normalizePref('weird')).toBe('auto');
    expect(normalizePref(null)).toBe('auto');
  });

  /** Выполняем настоящий скрипт из <head> на заглушках браузера */
  function run(opts: { stored?: string | null; hour: number; throwStorage?: boolean }) {
    const classes = new Set<string>();
    const meta = { content: '' };
    const doc = {
      documentElement: {
        classList: { toggle: (c: string, on: boolean) => (on ? classes.add(c) : classes.delete(c)) },
        style: {} as Record<string, string>,
      },
      querySelector: () => ({ setAttribute: (_: string, v: string) => (meta.content = v) }),
    };
    const storage = {
      getItem: (k: string) => {
        if (opts.throwStorage) throw new Error('blocked');
        return k === THEME_KEY ? (opts.stored ?? null) : null;
      },
    };
    class FakeDate {
      getHours() {
        return opts.hour;
      }
    }
    new Function('document', 'localStorage', 'Date', applyThemeScript)(doc, storage, FakeDate);
    return { dark: classes.has('dark'), scheme: doc.documentElement.style.colorScheme, color: meta.content };
  }

  it('скрипт: авто вечером — тёмная, днём — светлая', () => {
    expect(run({ hour: 21 })).toEqual({ dark: true, scheme: 'dark', color: '#0b1220' });
    expect(run({ hour: 3 }).dark).toBe(true);
    expect(run({ hour: 7 })).toEqual({ dark: false, scheme: 'light', color: '#eef2f9' });
    expect(run({ hour: 14 }).dark).toBe(false);
  });

  it('скрипт: ручной выбор сильнее времени', () => {
    expect(run({ stored: 'light', hour: 23 }).dark).toBe(false);
    expect(run({ stored: 'dark', hour: 12 }).dark).toBe(true);
    expect(run({ stored: 'garbage', hour: 22 }).dark).toBe(true);
  });

  it('скрипт: недоступное хранилище не ломает страницу', () => {
    expect(run({ hour: 22, throwStorage: true }).dark).toBe(true);
    expect(run({ hour: 12, throwStorage: true }).dark).toBe(false);
  });
});

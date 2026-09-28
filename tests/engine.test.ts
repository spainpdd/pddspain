import { describe, it, expect } from 'vitest';
import {
  evaluateTest, computeStatuses, pickErrorBatch, extendAccess, decideClaim, dailyIndex,
  madridDateKey, hasPaidAccess, canOpenTest, nextAfter, currentTest,
} from '../lib/engine';

describe('evaluateTest', () => {
  it('0 ошибок — perfect, 1–2 — pass_review, 3+ — fail', () => {
    expect(evaluateTest(0)).toBe('perfect');
    expect(evaluateTest(1)).toBe('pass_review');
    expect(evaluateTest(2)).toBe('pass_review');
    expect(evaluateTest(3)).toBe('fail');
    expect(evaluateTest(30)).toBe('fail');
  });
});

describe('computeStatuses', () => {
  it('первый доступен, следующий открывается только после сдачи предыдущего', () => {
    const st = computeStatuses([1, 2, 3, 4], new Set([1, 2]));
    expect([...st.values()]).toEqual(['passed', 'passed', 'available', 'locked']);
  });
  it('ничего не сдано — доступен только первый', () => {
    const st = computeStatuses([1, 2, 3], new Set());
    expect([...st.values()]).toEqual(['available', 'locked', 'locked']);
  });
  it('пропуски в нумерации не ломают цепочку', () => {
    const st = computeStatuses([1, 5, 9], new Set([1]));
    expect(st.get(5)).toBe('available');
    expect(st.get(9)).toBe('locked');
  });
  it('currentTest / nextAfter', () => {
    expect(currentTest([{ category: 'official', number: 1, status: 'passed' }, { category: 'official', number: 2, status: 'available' }])).toBe(2);
    expect(currentTest([{ category: 'official', number: 1, status: 'passed' }])).toBeNull();
    expect(nextAfter([1, 2, 3], 3)).toBeNull();
    expect(nextAfter([1, 2, 3], 1)).toBe(2);
  });
});

describe('pickErrorBatch', () => {
  const mk = (id: string, t: number, w: number) => ({ question_id: id, times_wrong: w, last_seen_at: new Date(t) });
  it('не больше 5; давно не показанные — первыми', () => {
    const rows = [mk('a', 6, 1), mk('b', 1, 1), mk('c', 2, 1), mk('d', 3, 1), mk('e', 4, 1), mk('f', 5, 1), mk('g', 0, 1)];
    expect(pickErrorBatch(rows).map((r) => r.question_id)).toEqual(['g', 'b', 'c', 'd', 'e']);
  });
  it('при равенстве времени — чаще ошибавшиеся первыми', () => {
    const rows = [mk('a', 1, 1), mk('b', 1, 4), mk('c', 1, 2)];
    expect(pickErrorBatch(rows).map((r) => r.question_id)).toEqual(['b', 'c', 'a']);
  });
  it('меньше 5 — отдаёт сколько есть', () => {
    expect(pickErrorBatch([mk('a', 1, 1)])).toHaveLength(1);
    expect(pickErrorBatch([])).toHaveLength(0);
  });
});

describe('доступ', () => {
  const now = new Date('2026-09-21T10:00:00Z');
  it('hasPaidAccess', () => {
    expect(hasPaidAccess(null, now)).toBe(false);
    expect(hasPaidAccess('2026-09-20T00:00:00Z', now)).toBe(false);
    expect(hasPaidAccess('2026-09-22T00:00:00Z', now)).toBe(true);
  });
  it('canOpenTest: бесплатные тесты открыты всем', () => {
    expect(canOpenTest('official', 1, false, 1)).toBe(true);
    expect(canOpenTest('official', 2, false, 1)).toBe(false);
    expect(canOpenTest('official', 2, true, 1)).toBe(true);
    expect(canOpenTest('official', 1, false, 0)).toBe(false);
  });
  it('extendAccess: прибавляет к текущему сроку, а истёкший считает от сегодня', () => {
    expect(extendAccess('2026-10-01T10:00:00Z', 100, now).toISOString()).toBe('2027-01-09T10:00:00.000Z');
    expect(extendAccess('2026-01-01T00:00:00Z', 100, now).toISOString()).toBe('2026-12-30T10:00:00.000Z');
    expect(extendAccess(null, 100, now).toISOString()).toBe('2026-12-30T10:00:00.000Z');
  });
});

describe('decideClaim (гарантия)', () => {
  const now = new Date('2026-10-20T10:00:00Z');
  const base = { eligible: true, alreadyPassed: false, result: 'failed' as const, examDate: '2026-10-19', firstPaymentAt: new Date('2026-09-21T10:00:00Z'), now };
  it('не сдал → +30 дней', () => {
    expect(decideClaim(base)).toEqual({ ok: true, addDays: 30, markPassed: false });
  });
  it('сдал → закрывает гарантию, дней не добавляет', () => {
    expect(decideClaim({ ...base, result: 'passed' })).toEqual({ ok: true, addDays: 0, markPassed: true });
  });
  it('без оплаты / после сдачи / будущая дата / дата до оплаты / кривая дата', () => {
    expect(decideClaim({ ...base, eligible: false })).toEqual({ ok: false, reason: 'not_eligible' });
    expect(decideClaim({ ...base, alreadyPassed: true })).toEqual({ ok: false, reason: 'already_passed' });
    expect(decideClaim({ ...base, examDate: '2026-12-01' })).toEqual({ ok: false, reason: 'future_date' });
    expect(decideClaim({ ...base, examDate: '2026-08-01' })).toEqual({ ok: false, reason: 'before_payment' });
    expect(decideClaim({ ...base, examDate: 'вчера' })).toEqual({ ok: false, reason: 'bad_date' });
  });
});

describe('вопрос дня', () => {
  it('стабилен для одной даты и в пределах пула', () => {
    const a = dailyIndex('2026-09-21', 500);
    expect(a).toBe(dailyIndex('2026-09-21', 500));
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(500);
    expect(dailyIndex('2026-09-22', 500)).not.toBe(a);
    expect(dailyIndex('2026-09-21', 0)).toBe(-1);
  });
  it('madridDateKey — формат YYYY-MM-DD и учёт часового пояса', () => {
    expect(madridDateKey(new Date('2026-09-21T10:00:00Z'))).toBe('2026-09-21');
    // 22:30 UTC летом = 00:30 следующего дня в Мадриде
    expect(madridDateKey(new Date('2026-07-01T22:30:00Z'))).toBe('2026-07-02');
  });
});

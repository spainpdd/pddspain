import { describe, it, expect } from 'vitest';
import {
  evaluateTest, computeCourseStatuses, pickErrorBatch, extendAccess, decideClaim, dailyIndex,
  madridDateKey, hasPaidAccess, canOpenTest, currentTest, readinessPercent, errorTone, orderTests,
  checkpointMilestones, computeCheckpoints, canOpenCheckpoint, pickRandom, checkpointPassed, isMidMilestone,
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

describe('computeCourseStatuses', () => {
  const set = (...n: number[]) => new Set(n);
  it('первый доступен, следующий открывается только после сдачи предыдущего', () => {
    expect([...computeCourseStatuses(4, set(1, 2), set()).values()]).toEqual(['passed', 'passed', 'available', 'locked']);
  });
  it('ничего не сдано — доступен только первый', () => {
    expect([...computeCourseStatuses(3, set(), set()).values()]).toEqual(['available', 'locked', 'locked']);
  });
  it('после 10-го теста следующий закрыт, пока не сдана проверка', () => {
    const all10 = set(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
    expect(computeCourseStatuses(25, all10, set()).get(11)).toBe('locked');
    expect(computeCourseStatuses(25, all10, set(10)).get(11)).toBe('available');
    expect(computeCourseStatuses(25, all10, set(10)).get(12)).toBe('locked');
  });
  it('на последнем тесте проверка ничего не блокирует (финальная — после курса)', () => {
    const st = computeCourseStatuses(10, set(1, 2, 3, 4, 5, 6, 7, 8, 9, 10), set());
    expect(st.get(10)).toBe('passed');
    expect(isMidMilestone(10, 10)).toBe(false);
    expect(isMidMilestone(10, 11)).toBe(true);
  });
  it('currentTest — первый открытый несданный', () => {
    expect(currentTest([{ status: 'passed' as const }, { status: 'available' as const }, { status: 'locked' as const }])).toEqual({ status: 'available' });
    expect(currentTest([{ status: 'passed' as const }])).toBeNull();
  });
});

describe('проверки (закрепление)', () => {
  it('рубежи: после 10, 20, … по k+2 теста, финальная — 15 тестов в конце', () => {
    const m = checkpointMilestones(93);
    expect(m.slice(0, 3)).toEqual([
      { milestone: 10, kind: 'mid', tests: 3 },
      { milestone: 20, kind: 'mid', tests: 4 },
      { milestone: 30, kind: 'mid', tests: 5 },
    ]);
    expect(m.filter((x) => x.kind === 'mid')).toHaveLength(9);
    expect(m[m.length - 1]).toEqual({ milestone: 93, kind: 'final', tests: 15 });
  });
  it('если курс кратен 10, на последнем рубеже стоит только финальная проверка', () => {
    const m = checkpointMilestones(90);
    expect(m.filter((x) => x.milestone === 90)).toEqual([{ milestone: 90, kind: 'final', tests: 15 }]);
    expect(checkpointMilestones(0)).toEqual([]);
    expect(checkpointMilestones(3)).toEqual([{ milestone: 3, kind: 'final', tests: 15 }]);
  });
  it('доступна, когда сданы все тесты до рубежа; сданной остаётся навсегда', () => {
    const p = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(computeCheckpoints(25, p, new Set())[0].status).toBe('locked');
    p.add(10);
    expect(computeCheckpoints(25, p, new Set())[0].status).toBe('available');
    expect(computeCheckpoints(25, p, new Set([10]))[0].status).toBe('passed');
    expect(computeCheckpoints(25, p, new Set())[1].status).toBe('locked');
  });
  it('без подписки — только проверки в бесплатном пуле (до 20)', () => {
    expect(canOpenCheckpoint(10, false)).toBe(true);
    expect(canOpenCheckpoint(20, false)).toBe(true);
    expect(canOpenCheckpoint(30, false)).toBe(false);
    expect(canOpenCheckpoint(30, true)).toBe(true);
  });
  it('pickRandom: разные элементы, нужное число, не больше доступного', () => {
    const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const r = pickRandom(pool, 3);
    expect(r).toHaveLength(3);
    expect(new Set(r).size).toBe(3);
    expect(r.every((x) => pool.includes(x))).toBe(true);
    expect(pickRandom([1, 2], 15)).toHaveLength(2);
    expect(pickRandom([], 3)).toEqual([]);
    expect(pool).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]); // исходный массив не меняется
    expect(pickRandom(pool, 3, () => 0)).toEqual([1, 2, 3]);
  });
  it('сдана, только если в КАЖДОМ тесте не больше 2 ошибок', () => {
    expect(checkpointPassed([{ errors: 0 }, { errors: 2 }, { errors: 1 }])).toBe(true);
    expect(checkpointPassed([{ errors: 0 }, { errors: 3 }, { errors: 0 }])).toBe(false);
    expect(checkpointPassed([])).toBe(false);
  });
});

describe('pickErrorBatch', () => {
  const mk = (id: string, t: number, w: number, pending?: number) => ({ question_id: id, times_wrong: w, pending, last_seen_at: new Date(t) });
  it('при равенстве времени больше повторений — раньше', () => {
    expect(pickErrorBatch([mk('a', 1, 9, 1), mk('b', 1, 1, 5)]).map((r) => r.question_id)).toEqual(['b', 'a']);
  });
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
  it('canOpenTest: платный доступ открывает всё, что открыто по очереди', () => {
    expect(canOpenTest({ display: 50, status: 'available' }, { paid: true, todayFreeTest: null })).toBe(true);
  });
  it('canOpenTest: без оплаты — один бесплатный тест в день из первых 20 (сквозной номер курса)', () => {
    const noFree = { paid: false, todayFreeTest: null };
    expect(canOpenTest({ display: 1, status: 'available' }, noFree)).toBe(true);
    expect(canOpenTest({ display: 20, status: 'available' }, noFree)).toBe(true);
    expect(canOpenTest({ display: 21, status: 'available' }, noFree)).toBe(false);
    expect(canOpenTest({ display: 50, status: 'available' }, noFree)).toBe(false); // дополнительные тесты больше не бесплатны для всех
    // уже выбран тест 5 сегодня — он и только он новый доступен
    const picked5 = { paid: false, todayFreeTest: 5 };
    expect(canOpenTest({ display: 5, status: 'available' }, picked5)).toBe(true);
    expect(canOpenTest({ display: 7, status: 'available' }, picked5)).toBe(false);
  });
  it('canOpenTest: уже сданный тест free-пользователь открывает повторно, даже если сегодня начат другой', () => {
    const acc = { paid: false, todayFreeTest: 3 };
    expect(canOpenTest({ display: 1, status: 'passed' }, acc)).toBe(true);
    expect(canOpenTest({ display: 3, status: 'available' }, acc)).toBe(true);
    expect(canOpenTest({ display: 4, status: 'available' }, acc)).toBe(false);
  });
  it('readinessPercent: сданные тесты к общему числу', () => {
    expect(readinessPercent(1, 90)).toBe(1);
    expect(readinessPercent(45, 90)).toBe(50);
    expect(readinessPercent(90, 90)).toBe(100);
    expect(readinessPercent(0, 90)).toBe(0);
    expect(readinessPercent(5, 0)).toBe(0);
  });
  it('orderTests: официальные первыми, затем остальные; сквозная нумерация', () => {
    const list = [
      { category: 'mixed' as const, number: 2 },
      { category: 'official' as const, number: 2 },
      { category: 'mixed' as const, number: 1 },
      { category: 'official' as const, number: 1 },
      { category: 'official' as const, number: 3 },
    ];
    expect(orderTests(list).map((t) => `${t.category}${t.number}:${t.display}`)).toEqual([
      'official1:1', 'official2:2', 'official3:3', 'mixed1:4', 'mixed2:5',
    ]);
    expect(orderTests([])).toEqual([]);
  });
  it('errorTone: цвет плитки по ошибкам', () => {
    expect(errorTone(null)).toBe('none');
    expect(errorTone(0)).toBe('perfect');
    expect(errorTone(1)).toBe('one');
    expect(errorTone(2)).toBe('two');
    expect(errorTone(3)).toBe('bad');
    expect(errorTone(9)).toBe('bad');
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

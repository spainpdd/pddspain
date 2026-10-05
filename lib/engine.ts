/**
 * Правила обучения — чистые функции без обращения к БД (легко тестировать).
 *
 *  • Тесты идут одним курсом по порядку (1…N). Следующий открывается, когда предыдущий «сдан».
 *  • После каждых 10 тестов — проверка («закрепление»): k+2 случайных теста из пройденных, по 30 минут
 *    на тест, не больше 2 ошибок в каждом; пока она не сдана, следующий тест закрыт.
 *    После последнего теста — финальная проверка из 15 случайных тестов.
 *  • 0 ошибок           → тест сдан, идём дальше.
 *  • 1–2 ошибки         → тест сдан; эти ошибки сразу даются на повторное решение
 *                          и одновременно сохраняются в раздел «Ошибки».
 *  • 3 и более ошибок   → тест НЕ сдан, следующий закрыт, пока не получится ≤ 2.
 *  • Раздел «Ошибки»    → выдаёт по 5 ранее ошибочных вопросов. Каждая ошибка добавляет вопросу
 *                          одно «повторение», верный ответ в разделе снимает одно.
 */
import type { Choice, TestCategory, TestListItem, TestStatus } from './types';

export const TEST_COUNT = 90;
export const TEST_SIZE = 30;
export const MAX_ERRORS = 2;
export const ERRORS_BATCH = 5;

export const ACCESS_DAYS = 100;
/** Цена по умолчанию (используется, пока в app_config нет своей записи) */
export const PRICE_CENTS = 4900;
/** На сколько дней продлевается доступ по гарантии после несданного экзамена */
export const GUARANTEE_EXTENSION_DAYS = 30;

/** Сколько первых тестов входят в пул «можно решить один бесплатно сегодня» */
export const FREE_TEST_POOL = 20;

export type TestOutcome = 'perfect' | 'pass_review' | 'fail';

export function evaluateTest(errors: number): TestOutcome {
  if (errors <= 0) return 'perfect';
  if (errors <= MAX_ERRORS) return 'pass_review';
  return 'fail';
}

export function isPassed(errors: number): boolean {
  return errors <= MAX_ERRORS;
}

/**
 * Статусы тестов курса. Тесты идут подряд 1…total (сквозной номер `display`).
 * Тест открыт, если предыдущий сдан и — когда предыдущий был «контрольным» (кратен 10, не последний) —
 * сдана проверка после него. Первый тест открыт всегда.
 */
export function computeCourseStatuses(total: number, passed: Set<number>, cleared: Set<number>): Map<number, TestStatus> {
  const out = new Map<number, TestStatus>();
  let open = true;
  for (let d = 1; d <= total; d++) {
    out.set(d, passed.has(d) ? 'passed' : open ? 'available' : 'locked');
    open = passed.has(d) && (!isMidMilestone(d, total) || cleared.has(d));
  }
  return out;
}

// ---------------------------------------------------------------- проверки (закрепление)

/** Через сколько тестов ставится промежуточная проверка */
export const MID_STEP = 10;
/** Сколько тестов в финальной проверке */
export const FINAL_TESTS = 15;
/** Минут на каждый тест проверки */
export const CHECK_MINUTES = 30;

export type CheckKind = 'mid' | 'final';
export type CheckStatus = 'locked' | 'available' | 'passed';

export interface Milestone {
  /** после какого по счёту теста курса */
  milestone: number;
  kind: CheckKind;
  /** сколько случайных тестов входит в проверку */
  tests: number;
}

export function isMidMilestone(m: number, total: number): boolean {
  return m > 0 && m < total && m % MID_STEP === 0;
}

/** Все проверки курса из `total` тестов: после 10, 20, … (3, 4, 5… теста) и финальная после последнего (15 тестов) */
export function checkpointMilestones(total: number): Milestone[] {
  const out: Milestone[] = [];
  for (let m = MID_STEP; m < total; m += MID_STEP) out.push({ milestone: m, kind: 'mid', tests: m / MID_STEP + 2 });
  if (total > 0) out.push({ milestone: total, kind: 'final', tests: FINAL_TESTS });
  return out;
}

export interface CheckpointInfo extends Milestone {
  status: CheckStatus;
}

/** Проверка доступна, когда сданы все тесты курса до неё включительно; сданной она остаётся навсегда */
export function computeCheckpoints(total: number, passed: Set<number>, cleared: Set<number>): CheckpointInfo[] {
  return checkpointMilestones(total).map((m) => {
    let all = true;
    for (let d = 1; d <= m.milestone && all; d++) all = passed.has(d);
    return { ...m, status: cleared.has(m.milestone) ? 'passed' : all ? 'available' : 'locked' };
  });
}

/** Бесплатно можно проверки в пределах бесплатного пула тестов, остальное — по подписке */
export function canOpenCheckpoint(milestone: number, paid: boolean): boolean {
  return paid || milestone <= FREE_TEST_POOL;
}

/** Случайные `n` разных элементов (частичный Фишер — Йейтс); `rnd` подставляется в тестах */
export function pickRandom<T>(items: T[], n: number, rnd: () => number = Math.random): T[] {
  const a = [...items];
  const k = Math.min(Math.max(n, 0), a.length);
  for (let i = 0; i < k; i++) {
    const j = i + Math.floor(rnd() * (a.length - i));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, k);
}

/** Проверка сдана, если в КАЖДОМ тесте не больше MAX_ERRORS ошибок (неотвеченные считаются ошибками) */
export function checkpointPassed(results: { errors: number }[]): boolean {
  return results.length > 0 && results.every((r) => r.errors <= MAX_ERRORS);
}

/** Первый несданный открытый тест курса (для кнопки «Продолжить» на главной) */
export function currentTest<T extends Pick<TestListItem, 'status'>>(list: T[]): T | null {
  return list.find((t) => t.status === 'available') ?? null;
}

/**
 * Единый список тестов для пользователя: сначала «official», потом «mixed» (каждая группа по номерам).
 * `display` — сквозной номер в этом списке (1, 2, 3 …): именно он показывается на плитках и в плеере,
 * потому что собственные номера в категориях пересекаются.
 */
export function orderTests<T extends { category: TestCategory; number: number }>(list: T[]): (T & { display: number })[] {
  const byCat = (c: TestCategory) => list.filter((t) => t.category === c).sort((a, b) => a.number - b.number);
  return [...byCat('official'), ...byCat('mixed')].map((t, i) => ({ ...t, display: i + 1 }));
}

export interface ErrorRow {
  question_id: string;
  times_wrong: number;
  /** сколько повторений ещё нужно (по умолчанию 1) */
  pending?: number;
  last_seen_at: string | Date;
}

/** Порядок выдачи ошибок: давно не показывали → раньше; при равенстве — больше повторений, затем чаще ошибался */
export function pickErrorBatch<T extends ErrorRow>(rows: T[], size = ERRORS_BATCH): T[] {
  return [...rows]
    .sort((a, b) => {
      const ta = new Date(a.last_seen_at).getTime();
      const tb = new Date(b.last_seen_at).getTime();
      if (ta !== tb) return ta - tb;
      const pa = a.pending ?? 1, pb = b.pending ?? 1;
      if (pa !== pb) return pb - pa;
      return b.times_wrong - a.times_wrong;
    })
    .slice(0, size);
}

// ---------------------------------------------------------------- доступ

export function hasPaidAccess(accessUntil: string | Date | null | undefined, now = new Date()): boolean {
  if (!accessUntil) return false;
  return new Date(accessUntil).getTime() > now.getTime();
}

export interface FreeAccess {
  paid: boolean;
  /** Сквозной номер нового (ещё не сданного) теста, который пользователь уже начал сегодня (null — ещё нет) */
  todayFreeTest: number | null;
}

/**
 * Можно ли открыть тест курса (порядок «по очереди» задаёт computeCourseStatuses).
 *  • платный доступ — открыто всё, что открыто по очереди.
 *  • иначе          — бесплатно только тесты 1…FREE_TEST_POOL: уже сданные — всегда
 *                      (повторение), а новый — один в день (тот, что начат сегодня,
 *                      либо ещё не начатый).
 */
export function canOpenTest(t: { display: number; status: TestStatus }, acc: FreeAccess): boolean {
  if (acc.paid) return true;
  if (t.display > FREE_TEST_POOL) return false;
  if (t.status === 'passed') return true;
  return acc.todayFreeTest === null || acc.todayFreeTest === t.display;
}

/** «Готовность к экзамену»: доля сданных тестов от их общего числа, 0…100 */
export function readinessPercent(passedTests: number, totalTests: number): number {
  if (totalTests <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((passedTests / totalTests) * 100)));
}

export type ErrorTone = 'perfect' | 'one' | 'two' | 'bad' | 'none';

/** Цвет плитки по лучшему результату: 0 ошибок — зелёный, 1 — жёлтый, 2 — оранжевый, 3+ — красный */
export function errorTone(bestErrors: number | null | undefined): ErrorTone {
  if (bestErrors === null || bestErrors === undefined) return 'none';
  if (bestErrors <= 0) return 'perfect';
  if (bestErrors === 1) return 'one';
  if (bestErrors === 2) return 'two';
  return 'bad';
}

export function addDays(base: Date, days: number): Date {
  return new Date(base.getTime() + days * 86_400_000);
}

/** Новая дата окончания доступа: если доступ ещё идёт — прибавляем к нему, иначе от «сейчас» */
export function extendAccess(current: string | Date | null | undefined, days: number, now = new Date()): Date {
  const base = current && new Date(current).getTime() > now.getTime() ? new Date(current) : now;
  return addDays(base, days);
}

// ---------------------------------------------------------------- гарантия

export type ClaimResult = 'failed' | 'passed';

export interface ClaimInput {
  eligible: boolean;
  alreadyPassed: boolean;
  result: ClaimResult;
  examDate: string; // YYYY-MM-DD
  firstPaymentAt: Date | null;
  now?: Date;
}

export type ClaimDecision =
  | { ok: true; addDays: number; markPassed: boolean }
  | { ok: false; reason: 'not_eligible' | 'already_passed' | 'bad_date' | 'future_date' | 'before_payment' };

export function decideClaim(i: ClaimInput): ClaimDecision {
  const now = i.now ?? new Date();
  if (!i.eligible) return { ok: false, reason: 'not_eligible' };
  if (i.alreadyPassed) return { ok: false, reason: 'already_passed' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(i.examDate)) return { ok: false, reason: 'bad_date' };
  const d = new Date(i.examDate + 'T12:00:00Z');
  if (Number.isNaN(d.getTime())) return { ok: false, reason: 'bad_date' };
  if (d.getTime() > now.getTime() + 86_400_000) return { ok: false, reason: 'future_date' };
  // сравниваем по календарным дням (UTC): экзамен не раньше чем за сутки до дня оплаты
  const payDay = i.firstPaymentAt ? Date.UTC(i.firstPaymentAt.getUTCFullYear(), i.firstPaymentAt.getUTCMonth(), i.firstPaymentAt.getUTCDate()) : null;
  if (payDay !== null && Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) < payDay - 86_400_000) {
    return { ok: false, reason: 'before_payment' };
  }
  return i.result === 'passed'
    ? { ok: true, addDays: 0, markPassed: true }
    : { ok: true, addDays: GUARANTEE_EXTENSION_DAYS, markPassed: false };
}

// ---------------------------------------------------------------- вопрос дня

/** Стабильный выбор индекса по дате (одинаковый для всех пользователей в этот день) */
export function dailyIndex(dateKey: string, poolSize: number): number {
  if (poolSize <= 0) return -1;
  let h = 2166136261;
  for (let i = 0; i < dateKey.length; i++) {
    h ^= dateKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % poolSize;
}

/** Ключ даты по Мадриду (YYYY-MM-DD) */
export function madridDateKey(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  return parts; // en-CA даёт YYYY-MM-DD
}

export function isChoice(x: unknown): x is Choice {
  return x === 'a' || x === 'b' || x === 'c';
}

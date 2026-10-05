import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Db } from '../lib/db';
import { makeDb, seedContent, makeUser, answersWithErrors } from './helpers';
import { getCourse } from '../lib/repo/content';
import { getErrorBatch, submitErrors, submitTest, RuleError } from '../lib/repo/progress';
import { getOrStartCheckpoint, loadRunQuestions, submitCheckpoint, testKey } from '../lib/repo/checkpoints';
import { getStats, countOpenErrors } from '../lib/repo/users';

let db: Db;
let ids: string[][];

beforeEach(async () => {
  db = await makeDb();
  // 3 официальных + 9 дополнительных тестов = единый курс из 12
  ids = await seedContent(db, { tests: 3 });
  const more = await seedContent(db, { tests: 9, category: 'mixed' });
  ids = [...ids, ...more];
});
afterEach(async () => {
  await db.close();
});

/** Сдаёт первые n тестов курса без ошибок */
async function passCourse(userId: string, n: number) {
  const { tests } = await getCourse(userId);
  for (const t of tests.slice(0, n)) {
    const qs = (await db.query('select question_id from test_questions where test_category = $1 and test_number = $2', [t.category, t.number])).map((r: any) => r.question_id);
    await submitTest(userId, t.category, t.number, answersWithErrors(qs, 0));
  }
}

/** Правильные ответы на все тесты набора, `wrongIn` — сколько ошибок в каждом тесте */
async function answersFor(run: Awaited<ReturnType<typeof getOrStartCheckpoint>>, wrongIn: number[] = []) {
  const tests = await loadRunQuestions(run);
  return Object.fromEntries(tests.map((t, i) => [t.key, answersWithErrors(t.questions.map((q) => q.id), wrongIn[i] ?? 0)]));
}

describe('единый курс', () => {
  it('нумерация сквозная: официальные, затем дополнительные; открываются по порядку', async () => {
    const u = await makeUser();
    const { tests } = await getCourse(u.id);
    expect(tests.map((t) => t.display)).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
    expect(tests.slice(0, 3).every((t) => t.category === 'official')).toBe(true);
    expect(tests[3].category).toBe('mixed');
    expect(tests.map((t) => t.status).slice(0, 3)).toEqual(['available', 'locked', 'locked']);
    // дополнительный тест №4 не открыт, пока не сданы предыдущие
    await passCourse(u.id, 3);
    expect((await getCourse(u.id)).tests[3].status).toBe('available');
  });

  it('после 10-го теста следующий закрыт, пока не сдана проверка', async () => {
    const u = await makeUser();
    await passCourse(u.id, 9);
    let c = await getCourse(u.id);
    expect(c.tests[9].status).toBe('available');
    expect(c.checkpoints.find((x) => x.milestone === 10)!.status).toBe('locked');
    await passCourse(u.id, 10);
    c = await getCourse(u.id);
    expect(c.tests[10].status).toBe('locked'); // 11-й
    expect(c.checkpoints.find((x) => x.milestone === 10)).toMatchObject({ kind: 'mid', tests: 3, status: 'available' });
  });
});

describe('промежуточная проверка', () => {
  it('нельзя начать, пока не сданы все тесты до рубежа', async () => {
    const u = await makeUser();
    await passCourse(u.id, 5);
    await expect(getOrStartCheckpoint(u.id, 10)).rejects.toMatchObject({ code: 'locked' });
    await expect(getOrStartCheckpoint(u.id, 7)).rejects.toMatchObject({ code: 'no_such_check' });
  });

  it('набор: 3 разных случайных теста из первых 10; повторный заход отдаёт тот же набор', async () => {
    const u = await makeUser();
    await passCourse(u.id, 10);
    const run = await getOrStartCheckpoint(u.id, 10);
    expect(run).toMatchObject({ kind: 'mid', milestone: 10 });
    expect(run.tests).toHaveLength(3);
    expect(new Set(run.tests.map((t) => testKey(t))).size).toBe(3);
    expect(run.tests.every((t) => t.display >= 1 && t.display <= 10)).toBe(true);
    const again = await getOrStartCheckpoint(u.id, 10);
    expect(again.id).toBe(run.id);
    expect(again.tests).toEqual(run.tests);
    const qs = await loadRunQuestions(run);
    expect(qs.every((t) => t.questions.length === 30)).toBe(true);
  });

  it('сдана при ≤2 ошибках в каждом тесте: следующий тест открывается, проверка остаётся сданной', async () => {
    const u = await makeUser();
    await passCourse(u.id, 10);
    const run = await getOrStartCheckpoint(u.id, 10);
    const r = await submitCheckpoint(u.id, 10, run.id, await answersFor(run, [2, 0, 1]));
    expect(r.passed).toBe(true);
    expect(r.tests.map((t) => t.errors)).toEqual([2, 0, 1]);
    const c = await getCourse(u.id);
    expect(c.tests[10].status).toBe('available');
    expect(c.checkpoints.find((x) => x.milestone === 10)!.status).toBe('passed');
    // 3 ошибки попали в раздел «Ошибки»
    expect(await countOpenErrors(u.id)).toBe(3);
    expect((await getStats(u.id)).total_answers).toBeGreaterThan(300); // ответы проверки пишутся в журнал
  });

  it('3 ошибки в любом одном тесте — не сдана; следующий закрыт; новая попытка тянет новые тесты', async () => {
    const u = await makeUser();
    await passCourse(u.id, 10);
    const run = await getOrStartCheckpoint(u.id, 10);
    const r = await submitCheckpoint(u.id, 10, run.id, await answersFor(run, [0, 3, 0]));
    expect(r.passed).toBe(false);
    expect((await getCourse(u.id)).tests[10].status).toBe('locked');
    // тот же run повторно отправить нельзя
    await expect(submitCheckpoint(u.id, 10, run.id, {})).rejects.toBeInstanceOf(RuleError);
    const run2 = await getOrStartCheckpoint(u.id, 10);
    expect(run2.id).not.toBe(run.id);
    const ok = await submitCheckpoint(u.id, 10, run2.id, await answersFor(run2));
    expect(ok.passed).toBe(true);
    expect((await getCourse(u.id)).tests[10].status).toBe('available');
  });

  it('неотвеченные вопросы (время вышло) считаются ошибками', async () => {
    const u = await makeUser();
    await passCourse(u.id, 10);
    const run = await getOrStartCheckpoint(u.id, 10);
    const answers = await answersFor(run);
    const first = Object.keys(answers)[0];
    answers[first] = {}; // ни одного ответа в первом тесте
    const r = await submitCheckpoint(u.id, 10, run.id, answers);
    expect(r.passed).toBe(false);
    expect(r.tests[0].errors).toBe(30);
    expect(r.tests[0].wrongIds).toHaveLength(30);
    expect(await countOpenErrors(u.id)).toBe(30);
  });

  it('чужой или несуществующий run отклоняется', async () => {
    const a = await makeUser();
    const b = await makeUser();
    await passCourse(a.id, 10);
    const run = await getOrStartCheckpoint(a.id, 10);
    await expect(submitCheckpoint(b.id, 10, run.id, {})).rejects.toMatchObject({ code: 'no_active_run' });
    await expect(submitCheckpoint(a.id, 20, run.id, {})).rejects.toMatchObject({ code: 'no_active_run' });
  });
});

describe('финальная проверка', () => {
  it('появляется после последнего теста: все тесты курса в пуле, не больше 15', async () => {
    const u = await makeUser();
    await passCourse(u.id, 10);
    expect((await getCourse(u.id)).checkpoints.find((x) => x.kind === 'final')!.status).toBe('locked');
    // 11-й тест закрыт, пока не сдана проверка на рубеже 10: сдаём её, затем 11 и 12
    const mid = await getOrStartCheckpoint(u.id, 10);
    await submitCheckpoint(u.id, 10, mid.id, await answersFor(mid));
    await passCourse(u.id, 12);
    const final = (await getCourse(u.id)).checkpoints.find((x) => x.kind === 'final')!;
    expect(final).toMatchObject({ milestone: 12, tests: 15, status: 'available' });
    const run = await getOrStartCheckpoint(u.id, 12);
    expect(run.kind).toBe('final');
    expect(run.tests).toHaveLength(12); // всего 12 тестов < 15
    const r = await submitCheckpoint(u.id, 12, run.id, await answersFor(run));
    expect(r.passed).toBe(true);
    expect((await getCourse(u.id)).checkpoints.find((x) => x.kind === 'final')!.status).toBe('passed');
    // финал можно проходить снова: каждый раз новый набор
    const again = await getOrStartCheckpoint(u.id, 12);
    expect(again.id).not.toBe(run.id);
  });
});

describe('«Ошибки»: повторения', () => {
  it('10 ошибок в одном вопросе = 10 повторений; каждый верный ответ снимает одно', async () => {
    const u = await makeUser();
    const target = ids[0][0];
    for (let i = 0; i < 10; i++) await submitTest(u.id, 'official', 1, answersWithErrors(ids[0], 1));
    expect(await countOpenErrors(u.id)).toBe(10);
    expect((await getStats(u.id)).errors_open).toBe(1); // вопрос один
    for (let i = 9; i >= 0; i--) {
      const batch = await getErrorBatch(u.id);
      expect(batch.map((q) => q.id)).toEqual([target]);
      const r = await submitErrors(u.id, { [target]: 'a' });
      expect(r).toMatchObject({ correct: 1, wrong: 0, remaining: i });
    }
    expect(await getErrorBatch(u.id)).toHaveLength(0);
    expect((await getStats(u.id)).errors_resolved).toBe(1);
  });

  it('неверный ответ в разделе «Ошибки» добавляет ещё одно повторение', async () => {
    const u = await makeUser();
    await submitTest(u.id, 'official', 1, answersWithErrors(ids[0], 1));
    const q = ids[0][0];
    expect(await countOpenErrors(u.id)).toBe(1);
    expect(await submitErrors(u.id, { [q]: 'b' })).toMatchObject({ wrong: 1, remaining: 2 });
    expect(await submitErrors(u.id, { [q]: 'a' })).toMatchObject({ correct: 1, remaining: 1 });
    expect(await submitErrors(u.id, { [q]: 'a' })).toMatchObject({ correct: 1, remaining: 0 });
  });

  it('один и тот же вопрос, неверный в двух тестах проверки, даёт два повторения', async () => {
    const u = await makeUser();
    // общий вопрос в тесте 1 и тесте 2
    await db.query('update test_questions set question_id = $1 where test_category = $2 and test_number = 2 and position = 1', [ids[0][0], 'official']);
    await passCourse(u.id, 10);
    const run0 = await getOrStartCheckpoint(u.id, 10);
    // фиксируем набор: тесты 1 и 2 (в обоих есть общий вопрос) и тест 3
    const fixed = [1, 2, 3].map((n) => ({ category: 'official', number: n, display: n }));
    await db.query('update checkpoint_runs set tests = $2::jsonb where id = $1', [run0.id, JSON.stringify(fixed)]);
    const run = await getOrStartCheckpoint(u.id, 10);
    const tests = await loadRunQuestions(run);
    const answers = Object.fromEntries(tests.map((t) => [t.key, Object.fromEntries(t.questions.map((q) => [q.id, q.id === ids[0][0] ? 'b' : 'a']))]));
    const before = await countOpenErrors(u.id);
    await submitCheckpoint(u.id, 10, run.id, answers);
    expect((await countOpenErrors(u.id)) - before).toBe(2);
  });
});

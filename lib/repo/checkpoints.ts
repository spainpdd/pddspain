import { getDb } from '../db';
import { checkpointPassed, pickRandom } from '../engine';
import type { AnswerMap, PlayerQuestion, TestCategory } from '../types';
import { getCourse, getTestQuestions } from './content';
import { addErrors, cleanAnswers, LOG_SQL, RuleError } from './progress';

/** Проверки (закрепление): после каждых 10 тестов и финальная. Правила — в lib/engine.ts */

export interface RunTest {
  category: TestCategory;
  number: number;
  display: number;
}

export interface CheckRun {
  id: string;
  kind: 'mid' | 'final';
  milestone: number;
  tests: RunTest[];
  startedAt: string;
}

export interface RunTestWithQuestions extends RunTest {
  /** ключ набора ответов: `${category}:${number}` */
  key: string;
  questions: PlayerQuestion[];
}

export const testKey = (t: { category: string; number: number }) => `${t.category}:${t.number}`;

const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : String(v));
const mapRun = (r: any): CheckRun => ({
  id: r.id,
  kind: r.kind,
  milestone: r.milestone,
  tests: typeof r.tests === 'string' ? JSON.parse(r.tests) : r.tests,
  startedAt: iso(r.started_at),
});

/**
 * Текущая проверка пользователя на этом рубеже: если она уже начата — возвращает тот же набор тестов
 * (обновление страницы не «перебрасывает» случайные тесты); иначе тянет новый случайный набор
 * из пройденных тестов курса (для финальной — из всех).
 */
export async function getOrStartCheckpoint(userId: string, milestone: number): Promise<CheckRun> {
  const db = await getDb();
  return db.tx(async (q) => {
    const { tests, checkpoints } = await getCourse(userId, q);
    const cp = checkpoints.find((c) => c.milestone === milestone);
    if (!cp) throw new RuleError('no_such_check');
    if (cp.status === 'locked') throw new RuleError('locked');

    const active = await q.query(`select * from checkpoint_runs where user_id = $1 and milestone = $2 and status = 'active'`, [userId, milestone]);
    if (active[0]) return mapRun(active[0]);

    const pool = tests.filter((t) => t.display <= milestone);
    const picked: RunTest[] = pickRandom(pool, cp.tests).map((t) => ({ category: t.category, number: t.number, display: t.display }));
    if (!picked.length) throw new RuleError('no_tests');
    const ins = await q.query(
      `insert into checkpoint_runs (user_id, kind, milestone, tests) values ($1, $2, $3, $4::jsonb)
       on conflict (user_id, milestone) where status = 'active' do nothing returning *`,
      [userId, cp.kind, milestone, JSON.stringify(picked)],
    );
    if (ins[0]) return mapRun(ins[0]);
    // параллельный запрос успел раньше
    return mapRun((await q.query(`select * from checkpoint_runs where user_id = $1 and milestone = $2 and status = 'active'`, [userId, milestone]))[0]);
  });
}

/** Вопросы всех тестов проверки в порядке прохождения */
export async function loadRunQuestions(run: CheckRun): Promise<RunTestWithQuestions[]> {
  const out: RunTestWithQuestions[] = [];
  for (const t of run.tests) out.push({ ...t, key: testKey(t), questions: await getTestQuestions(t.category, t.number) });
  return out;
}

export interface CheckResultTest extends RunTest {
  errors: number;
  total: number;
  /** id неверно отвеченных (и неотвеченных) вопросов — для разбора */
  wrongIds: string[];
}

export interface CheckResult {
  passed: boolean;
  kind: 'mid' | 'final';
  milestone: number;
  tests: CheckResultTest[];
}

/**
 * Итог проверки. `answers` — ответы по тестам: { 'official:3': { questionId: 'a' } }.
 * Неотвеченные вопросы (вышло время) считаются ошибками. Все ошибки попадают в раздел «Ошибки»:
 * каждая — отдельным повторением.
 */
export async function submitCheckpoint(userId: string, milestone: number, runId: string, rawAnswers: unknown): Promise<CheckResult> {
  const raw = rawAnswers && typeof rawAnswers === 'object' ? (rawAnswers as Record<string, unknown>) : {};
  const db = await getDb();
  return db.tx(async (q) => {
    const rows = await q.query(`select * from checkpoint_runs where id = $1 and user_id = $2 and milestone = $3 and status = 'active' for update`, [runId, userId, milestone]);
    if (!rows[0]) throw new RuleError('no_active_run');
    const run = mapRun(rows[0]);

    const tests: CheckResultTest[] = [];
    const logQ: string[] = [], logC: string[] = [], logOk: boolean[] = [], allWrong: string[] = [];
    for (const t of run.tests) {
      const questions = await getTestQuestions(t.category, t.number, q);
      const ans: AnswerMap = cleanAnswers(raw[testKey(t)]);
      const wrongIds: string[] = [];
      for (const qu of questions) {
        const a = ans[qu.id];
        if (a) {
          logQ.push(qu.id);
          logC.push(a);
          logOk.push(a === qu.correct);
        }
        if (a !== qu.correct) wrongIds.push(qu.id);
      }
      allWrong.push(...wrongIds);
      tests.push({ ...t, errors: wrongIds.length, total: questions.length, wrongIds });
    }
    if (logQ.length) await q.query(LOG_SQL, [userId, logQ, logC, logOk, 'check']);
    await addErrors(q, userId, allWrong);

    const passed = checkpointPassed(tests);
    await q.query(`update checkpoint_runs set status = $2, results = $3::jsonb, finished_at = now() where id = $1`, [
      runId,
      passed ? 'passed' : 'failed',
      JSON.stringify(tests.map(({ category, number, display, errors, total }) => ({ category, number, display, errors, total }))),
    ]);
    return { passed, kind: run.kind, milestone, tests };
  });
}

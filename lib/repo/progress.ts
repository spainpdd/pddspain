import { getDb } from '../db';
import { env } from '../env';
import { ERRORS_BATCH, evaluateTest, FREE_TEST_POOL, isPassed, madridDateKey, pickErrorBatch, isChoice, type FreeAccess } from '../engine';
import { getQuestionsByIds, getTestQuestions, listTests } from './content';
import type { AnswerMap, Choice, PlayerQuestion, SubmitResult, TestCategory, TestListItem } from '../types';
import type { Queryable } from '../db';

/** Бесплатный тест, уже выбранный пользователем сегодня (по Мадриду), если есть */
export async function getTodayFreeTest(userId: string): Promise<number | null> {
  const db = await getDb();
  const rows = await db.query<{ test_number: number }>(
    `select test_number from daily_free_test where user_id = $1 and free_date = $2`,
    [userId, madridDateKey()],
  );
  return rows[0]?.test_number ?? null;
}

/** Закрепляет выбор «сегодняшнего» бесплатного теста (идемпотентно) */
async function claimTodayFreeTest(userId: string, n: number): Promise<void> {
  const db = await getDb();
  await db.query(
    `insert into daily_free_test (user_id, free_date, test_number) values ($1, $2, $3)
     on conflict (user_id, free_date) do nothing`,
    [userId, madridDateKey(), n],
  );
}

/** Вызывать сразу после успешной проверки canOpenTest — фиксирует бесплатный выбор дня, если он ещё не сделан */
export async function registerFreeAccess(userId: string, t: Pick<TestListItem, 'display' | 'status'>, acc: FreeAccess): Promise<void> {
  if (!acc.paid && t.display <= FREE_TEST_POOL && acc.todayFreeTest === null && t.status !== 'passed') {
    await claimTodayFreeTest(userId, t.display);
  }
}

export class RuleError extends Error {
  constructor(public code: string, message?: string) {
    super(message ?? code);
  }
}

export function cleanAnswers(a: unknown): AnswerMap {
  const out: AnswerMap = {};
  if (a && typeof a === 'object') {
    for (const [k, v] of Object.entries(a as Record<string, unknown>)) {
      if (/^[0-9a-f-]{36}$/i.test(k) && isChoice(v)) out[k] = v;
    }
  }
  return out;
}

export const LOG_SQL = `insert into answer_log (user_id, question_id, chosen, correct, context)
  select $1, x.qid, x.chosen, x.ok, $5
    from unnest($2::uuid[], $3::text[], $4::boolean[]) as x(qid, chosen, ok)`;

/**
 * Записывает ошибки в раздел «Ошибки»: каждая ошибка (в том числе повторная на тот же вопрос)
 * добавляет вопросу одно повторение — 10 ошибок на один вопрос = 10 повторений.
 */
export async function addErrors(q: Queryable, userId: string, questionIds: string[]): Promise<void> {
  if (!questionIds.length) return;
  await q.query(
    `insert into user_errors (user_id, question_id, times_wrong, pending, last_wrong_at, last_seen_at, resolved)
     select $1, x.id, x.n, x.n, now(), now(), false
       from (select qid as id, count(*)::int as n from unnest($2::uuid[]) as qid group by qid) x
     on conflict (user_id, question_id) do update set
       times_wrong   = user_errors.times_wrong + excluded.times_wrong,
       pending       = user_errors.pending + excluded.pending,
       last_wrong_at = now(),
       last_seen_at  = now(),
       resolved      = false`,
    [userId, questionIds],
  );
}

/** Отправка результата теста. Все правила (открыт ли тест, сколько ошибок, что сохранить) — здесь. */
export async function submitTest(userId: string, category: TestCategory, testNumber: number, rawAnswers: unknown): Promise<SubmitResult> {
  const answers = cleanAnswers(rawAnswers);
  const db = await getDb();
  return db.tx(async (q) => {
    const list = await listTests(userId, q);
    const item = list.find((t) => t.category === category && t.number === testNumber);
    if (!item) throw new RuleError('no_such_test');
    if (item.status === 'locked') throw new RuleError('locked');

    const questions = await getTestQuestions(category, testNumber, q);
    const ids = questions.map((x) => x.id);
    if (Object.keys(answers).length !== ids.length || ids.some((id) => !answers[id])) {
      throw new RuleError('incomplete');
    }

    const wrongIds = questions.filter((x) => answers[x.id] !== x.correct).map((x) => x.id);
    const errors = wrongIds.length;
    const passed = isPassed(errors);

    await q.query(LOG_SQL, [
      userId,
      ids,
      ids.map((id) => answers[id]),
      questions.map((x) => answers[x.id] === x.correct),
      'test',
    ]);

    await addErrors(q, userId, wrongIds);

    await q.query(
      `insert into test_progress (user_id, test_category, test_number, attempts, best_errors, last_errors, passed, passed_at, last_attempt_at)
       values ($1, $2, $3, 1, $4::int, $4::int, $5::boolean, case when $5::boolean then now() end, now())
       on conflict (user_id, test_category, test_number) do update set
         attempts        = test_progress.attempts + 1,
         best_errors     = least(coalesce(test_progress.best_errors, $4::int), $4::int),
         last_errors     = $4::int,
         passed          = test_progress.passed or $5::boolean,
         passed_at       = coalesce(test_progress.passed_at, case when $5::boolean then now() end),
         last_attempt_at = now()`,
      [userId, category, testNumber, errors, passed],
    );

    return {
      errors,
      total: ids.length,
      outcome: evaluateTest(errors),
      wrongIds,
      passed,
    };
  });
}

/** Повторное решение ошибок сразу после теста: пишем в журнал ответов, прогресс не трогаем */
export async function submitReview(userId: string, category: TestCategory, testNumber: number, rawAnswers: unknown) {
  const answers = cleanAnswers(rawAnswers);
  const db = await getDb();
  return db.tx(async (q) => {
    const questions = await getTestQuestions(category, testNumber, q);
    const byId = new Map(questions.map((x) => [x.id, x]));
    const ids = Object.keys(answers).filter((id) => byId.has(id));
    if (!ids.length) return { logged: 0 };
    await q.query(LOG_SQL, [
      userId,
      ids,
      ids.map((id) => answers[id]),
      ids.map((id) => answers[id] === byId.get(id)!.correct),
      'review',
    ]);
    return { logged: ids.length };
  });
}

/** Очередь «Ошибки»: до 5 вопросов, которые давно не показывались */
export async function getErrorBatch(userId: string, size = ERRORS_BATCH): Promise<PlayerQuestion[]> {
  const db = await getDb();
  const rows = await db.query(
    `select e.question_id, e.times_wrong, e.pending, e.last_seen_at
       from user_errors e join questions qs on qs.id = e.question_id
      where e.user_id = $1 and e.pending > 0
        and qs.is_active and (qs.rights_status <> 'unverified' or $2)`,
    [userId, env.serveUnverified],
  );
  const picked = pickErrorBatch(rows as any[], size);
  return getQuestionsByIds(picked.map((r: any) => r.question_id));
}

export async function submitErrors(userId: string, rawAnswers: unknown) {
  const answers = cleanAnswers(rawAnswers);
  const db = await getDb();
  return db.tx(async (q) => {
    const open = await q.query<{ question_id: string }>(
      'select question_id from user_errors where user_id = $1 and pending > 0',
      [userId],
    );
    const openSet = new Set(open.map((r) => r.question_id));
    const ids = Object.keys(answers).filter((id) => openSet.has(id));
    if (!ids.length) return { correct: 0, wrong: 0, ...(await pendingTotals(q, userId)) };

    const qs = await getQuestionsByIds(ids, q);
    const correctById = new Map(qs.map((x) => [x.id, x.correct as Choice]));
    const valid = ids.filter((id) => correctById.has(id));
    const oks = valid.map((id) => answers[id] === correctById.get(id));

    await q.query(LOG_SQL, [userId, valid, valid.map((id) => answers[id]), oks, 'errors']);

    const rightIds = valid.filter((_, i) => oks[i]);
    const wrongIds = valid.filter((_, i) => !oks[i]);
    if (rightIds.length) {
      // верный ответ снимает одно повторение
      await q.query(
        `update user_errors set pending = greatest(pending - 1, 0), resolved = (pending <= 1), last_seen_at = now()
          where user_id = $1 and question_id = any($2::uuid[])`,
        [userId, rightIds],
      );
    }
    if (wrongIds.length) {
      // неверный — добавляет ещё одно
      await q.query(
        `update user_errors set times_wrong = times_wrong + 1, pending = pending + 1, last_wrong_at = now(), last_seen_at = now(), resolved = false
          where user_id = $1 and question_id = any($2::uuid[])`,
        [userId, wrongIds],
      );
    }
    return { correct: rightIds.length, wrong: wrongIds.length, ...(await pendingTotals(q, userId)) };
  });
}

/** Сколько повторений (remaining) и разных вопросов (questions) осталось в разделе «Ошибки» */
async function pendingTotals(q: Queryable, userId: string): Promise<{ remaining: number; questions: number }> {
  const r = (
    await q.query<{ n: number; k: number }>(
      'select coalesce(sum(pending), 0)::int as n, count(*)::int as k from user_errors where user_id = $1 and pending > 0',
      [userId],
    )
  )[0];
  return { remaining: r.n, questions: r.k };
}

/** Ответ на «вопрос дня» (из бота) */
export async function submitDaily(userId: string, questionId: string, choice: Choice) {
  const db = await getDb();
  return db.tx(async (q) => {
    const [qu] = await getQuestionsByIds([questionId], q);
    if (!qu) throw new RuleError('no_such_question');
    const ok = choice === qu.correct;
    await q.query(LOG_SQL, [userId, [questionId], [choice], [ok], 'daily']);
    if (!ok) await addErrors(q, userId, [questionId]);
    return { correct: ok, question: qu };
  });
}

import { getDb, type Queryable } from '../db';
import { env } from '../env';
import { computeCheckpoints, computeCourseStatuses, dailyIndex, FREE_TEST_POOL, orderTests, type CheckpointInfo } from '../engine';
import type { Content, Lang, PlayerQuestion, TestCategory, TestListItem } from '../types';

export async function loadPlayerQuestions(
  rows: { id: string; correct: string; image_url: string | null; topic: string | null; rights_status?: string }[],
  q?: Queryable,
): Promise<PlayerQuestion[]> {
  if (!rows.length) return [];
  const db = q ?? (await getDb());
  const tr = await db.query(
    `select question_id, lang, text, option_a, option_b, option_c, explanation, status
       from question_translations where question_id = any($1::uuid[])`,
    [rows.map((r) => r.id)],
  );
  const by = new Map<string, Partial<Record<Lang, Content>>>();
  for (const t of tr) {
    const m = by.get(t.question_id) ?? {};
    m[t.lang as Lang] = {
      text: t.text,
      a: t.option_a,
      b: t.option_b,
      c: t.option_c,
      explanation: t.explanation,
      status: t.status,
    };
    by.set(t.question_id, m);
  }
  return rows.map((r) => ({
    id: r.id,
    correct: r.correct as PlayerQuestion['correct'],
    image_url: r.image_url,
    topic: r.topic,
    official: r.rights_status === 'dgt_official',
    i18n: by.get(r.id) ?? {},
  }));
}

export interface Course {
  /** тесты курса по порядку (официальные, затем дополнительные), у каждого сквозной номер display */
  tests: TestListItem[];
  /** проверки: после каждых 10 тестов и финальная */
  checkpoints: CheckpointInfo[];
}

/**
 * Курс пользователя: единая последовательность игровых тестов (в которых есть хотя бы один доступный вопрос)
 * и проверки между ними. Порядок: сначала «official» (права проверяются: unverified скрыт, если не включён
 * SERVE_UNVERIFIED_QUESTIONS), затем «mixed» (дополнительные из сторонних источников, видны со статусом unverified);
 * внутри — по номеру. Тест открывается, когда сдан предыдущий и сдана проверка, если она стоит между ними.
 */
export async function getCourse(userId: string, q?: Queryable): Promise<Course> {
  const db = q ?? (await getDb());
  const rows = await db.query<{ category: TestCategory; number: number; playable: number }>(
    `select t.category, t.number, count(qs.id)::int as playable
       from tests t
       join test_questions tq on tq.test_category = t.category and tq.test_number = t.number
       join questions qs on qs.id = tq.question_id and qs.is_active
         and (qs.rights_status <> 'unverified' or $1 or t.category = 'mixed')
      where t.is_active
      group by t.category, t.number`,
    [env.serveUnverified],
  );
  const ordered = orderTests(rows);
  const prog = await db.query(
    `select test_category, test_number, attempts, best_errors, last_errors, passed from test_progress where user_id = $1`,
    [userId],
  );
  const pm = new Map(prog.map((p: any) => [`${p.test_category}:${p.test_number}`, p]));
  const passed = new Set<number>();
  for (const t of ordered) if ((pm.get(`${t.category}:${t.number}`) as any)?.passed) passed.add(t.display);
  const cleared = new Set<number>(
    (await db.query<{ milestone: number }>(`select distinct milestone from checkpoint_runs where user_id = $1 and status = 'passed'`, [userId])).map(
      (r) => r.milestone,
    ),
  );
  const statuses = computeCourseStatuses(ordered.length, passed, cleared);
  const tests: TestListItem[] = ordered.map((t) => {
    const p: any = pm.get(`${t.category}:${t.number}`);
    const st = statuses.get(t.display)!;
    return {
      category: t.category,
      number: t.number,
      display: t.display,
      playable: t.playable,
      status: env.unlockAllTests && st === 'locked' ? 'available' : st,
      attempts: p?.attempts ?? 0,
      best_errors: p?.best_errors ?? null,
      last_errors: p?.last_errors ?? null,
      // бесплатный пул — первые FREE_TEST_POOL тестов курса
      free: t.display <= FREE_TEST_POOL,
    };
  });
  return { tests, checkpoints: computeCheckpoints(tests.length, passed, cleared) };
}

export async function listTests(userId: string, q?: Queryable): Promise<TestListItem[]> {
  return (await getCourse(userId, q)).tests;
}

export async function getTestQuestions(category: TestCategory, testNumber: number, q?: Queryable): Promise<PlayerQuestion[]> {
  const db = q ?? (await getDb());
  const rows = await db.query(
    `select qs.id, qs.correct, qs.image_url, qs.topic, qs.rights_status
       from tests t
       join test_questions tq on tq.test_category = t.category and tq.test_number = t.number
       join questions qs on qs.id = tq.question_id and qs.is_active
         and (qs.rights_status <> 'unverified' or $3 or t.category = 'mixed')
      where t.category = $1 and t.number = $2 and t.is_active
      order by tq.position`,
    [category, testNumber, env.serveUnverified],
  );
  return loadPlayerQuestions(rows, db);
}

export async function getQuestionsByIds(ids: string[], q?: Queryable): Promise<PlayerQuestion[]> {
  if (!ids.length) return [];
  const db = q ?? (await getDb());
  const rows = await db.query(
    `select qs.id, qs.correct, qs.image_url, qs.topic, qs.rights_status
       from questions qs
      where qs.id = any($1::uuid[]) and qs.is_active and (qs.rights_status <> 'unverified' or $2)`,
    [ids, env.serveUnverified],
  );
  const order = new Map(ids.map((id, i) => [id, i]));
  rows.sort((a: any, b: any) => order.get(a.id)! - order.get(b.id)!);
  return loadPlayerQuestions(rows, db);
}

/** Вопрос дня: стабильный выбор по дате из доступных вопросов, у которых есть испанский оригинал */
export async function getQuestionOfDay(dateKey: string): Promise<PlayerQuestion | null> {
  const db = await getDb();
  const pool = await db.query<{ id: string }>(
    `select qs.id from questions qs
      where qs.is_active and (qs.rights_status <> 'unverified' or $1)
        and exists (select 1 from question_translations t where t.question_id = qs.id and t.lang = 'es')
      order by qs.id`,
    [env.serveUnverified],
  );
  const i = dailyIndex(dateKey, pool.length);
  if (i < 0) return null;
  return (await getQuestionsByIds([pool[i].id]))[0] ?? null;
}

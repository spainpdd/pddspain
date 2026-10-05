import { getDb, type Queryable } from '../db';
import { env } from '../env';
import { computeStatuses, dailyIndex, FREE_TEST_POOL } from '../engine';
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

/**
 * Список игровых тестов (в которых есть хотя бы один доступный вопрос) + статус для пользователя.
 * Два независимых раздела (TestCategory): «official» — основной платный тренажёр с разблокировкой
 * по порядку и правами (unverified скрыт, если не включён SERVE_UNVERIFIED_QUESTIONS); «mixed» —
 * дополнительные тесты из сторонних источников: без ограничений прав, без блокировки по порядку,
 * без платного доступа — видны и доступны всем прямо со статусом unverified.
 */
export async function listTests(userId: string, q?: Queryable): Promise<TestListItem[]> {
  const db = q ?? (await getDb());
  const tests = await db.query<{ category: TestCategory; number: number; playable: number }>(
    `select t.category, t.number, count(qs.id)::int as playable
       from tests t
       join test_questions tq on tq.test_category = t.category and tq.test_number = t.number
       join questions qs on qs.id = tq.question_id and qs.is_active
         and (qs.rights_status <> 'unverified' or $1 or t.category = 'mixed')
      where t.is_active
      group by t.category, t.number
      order by t.category, t.number`,
    [env.serveUnverified],
  );
  const prog = await db.query(
    `select test_category, test_number, attempts, best_errors, last_errors, passed from test_progress where user_id = $1`,
    [userId],
  );
  const pm = new Map(prog.map((p: any) => [`${p.test_category}:${p.test_number}`, p]));
  const passedByCat = new Map<TestCategory, Set<number>>();
  for (const p of prog as any[]) {
    if (!p.passed) continue;
    const s = passedByCat.get(p.test_category) ?? new Set<number>();
    s.add(p.test_number);
    passedByCat.set(p.test_category, s);
  }
  const numbersByCat = new Map<TestCategory, number[]>();
  for (const t of tests) numbersByCat.set(t.category, [...(numbersByCat.get(t.category) ?? []), t.number]);
  const statusByCat = new Map<TestCategory, Map<number, 'locked' | 'available' | 'passed'>>();
  for (const [cat, nums] of numbersByCat) {
    // «mixed» — без блокировки по порядку: всё сразу доступно
    statusByCat.set(
      cat,
      cat === 'mixed'
        ? new Map(nums.map((n): [number, 'passed' | 'available'] => [n, passedByCat.get(cat)?.has(n) ? 'passed' : 'available']))
        : computeStatuses(nums, passedByCat.get(cat) ?? new Set()),
    );
  }
  return tests.map((t) => {
    const p: any = pm.get(`${t.category}:${t.number}`);
    const passedOfficial = passedByCat.get('official') ?? new Set<number>();
    const st = statusByCat.get(t.category)!.get(t.number)!;
    return {
      category: t.category,
      number: t.number,
      playable: t.playable,
      status: t.category === 'official' && env.unlockAllTests && !passedOfficial.has(t.number) ? 'available' : st,
      attempts: p?.attempts ?? 0,
      best_errors: p?.best_errors ?? null,
      last_errors: p?.last_errors ?? null,
      // «mixed» — без платного доступа, бесплатны все; «official» — в пуле «1 бесплатный тест в день»
      free: t.category === 'mixed' ? true : t.number <= FREE_TEST_POOL,
    };
  });
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

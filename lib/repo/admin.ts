import { getDb, type Queryable } from '../db';
import { env } from '../env';
import { TEST_COUNT, TEST_SIZE } from '../engine';
import { LANGS, RIGHTS_STATUSES, type Lang, type RightsStatus, type TestCategory } from '../types';
import { isChoiceStr } from '../types-io';
import { mapProfile, PROFILE_COLS } from './users';

export interface QuestionFilters {
  q?: string;
  rights?: string;
  active?: 'yes' | 'no' | '';
  missing?: Lang | '';      // нет перевода на этот язык
  machine?: Lang | '';      // перевод есть, но не проверен человеком
  topic?: string;
  test?: number;            // входит в тест №
  page?: number;
  perPage?: number;
}

export async function listQuestions(f: QuestionFilters) {
  const db = await getDb();
  const where: string[] = [];
  const p: unknown[] = [];
  const add = (sql: string, v: unknown) => {
    p.push(v);
    where.push(sql.replace(/\?/g, `$${p.length}`)); // все «?» в шаблоне → один и тот же параметр
  };
  if (f.q) add(`exists (select 1 from question_translations t where t.question_id = qs.id and (t.text ilike ? or t.option_a ilike ? or t.option_b ilike ? or t.option_c ilike ? or t.explanation ilike ?))`, `%${f.q}%`);
  if (f.rights && (RIGHTS_STATUSES as string[]).includes(f.rights)) add('qs.rights_status = ?', f.rights);
  if (f.active === 'yes') where.push('qs.is_active');
  if (f.active === 'no') where.push('not qs.is_active');
  if (f.topic) add('qs.topic = ?', f.topic);
  if (f.missing && LANGS.includes(f.missing)) add(`not exists (select 1 from question_translations t where t.question_id = qs.id and t.lang = ?)`, f.missing);
  if (f.machine && LANGS.includes(f.machine)) add(`exists (select 1 from question_translations t where t.question_id = qs.id and t.lang = ? and t.status = 'machine')`, f.machine);
  if (f.test) add('exists (select 1 from test_questions tq where tq.question_id = qs.id and tq.test_number = ?)', f.test);

  const w = where.length ? 'where ' + where.join(' and ') : '';
  const perPage = Math.min(Math.max(f.perPage ?? 50, 1), 200);
  const offset = (Math.max(f.page ?? 1, 1) - 1) * perPage;

  const total = (await db.query(`select count(*)::int as n from questions qs ${w}`, p))[0].n as number;
  const rows = await db.query(
    `select qs.id, qs.correct, qs.rights_status, qs.is_active, qs.topic, qs.image_url, qs.source, qs.updated_at,
            (select text from question_translations t where t.question_id = qs.id and t.lang = 'es') as text_es,
            (select json_object_agg(t.lang, t.status) from question_translations t where t.question_id = qs.id) as langs,
            (select coalesce(array_agg(tq.test_category || ':' || tq.test_number order by tq.test_category, tq.test_number), '{}') from test_questions tq where tq.question_id = qs.id) as tests
       from questions qs ${w}
      order by qs.created_at, qs.source_ref nulls last, qs.id
      limit ${perPage} offset ${offset}`,
    p,
  );
  return { rows, total, perPage };
}

export async function getQuestionFull(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const db = await getDb();
  const q = (await db.query('select * from questions where id = $1', [id]))[0];
  if (!q) return null;
  const tr = await db.query('select * from question_translations where question_id = $1', [id]);
  const tests = await db.query('select test_category, test_number, position from test_questions where question_id = $1 order by test_category, test_number', [id]);
  return { question: q, translations: Object.fromEntries(tr.map((t: any) => [t.lang, t])), tests };
}

export interface SaveQuestionInput {
  id?: string;
  correct: string;
  image_url?: string | null;
  topic?: string | null;
  rights_status: string;
  source?: string | null;
  is_active: boolean;
  i18n: Partial<Record<Lang, { text: string; a: string; b: string; c: string; explanation?: string | null; status?: 'machine' | 'reviewed' }>>;
}

export class ValidationError extends Error {}

export async function saveQuestion(input: SaveQuestionInput): Promise<string> {
  if (!isChoiceStr(input.correct)) throw new ValidationError('Правильный ответ должен быть A, B или C');
  if (!(RIGHTS_STATUSES as string[]).includes(input.rights_status)) throw new ValidationError('Неверный статус прав');
  const es = input.i18n.es;
  if (!es?.text?.trim() || !es.a?.trim() || !es.b?.trim()) {
    throw new ValidationError('Испанский оригинал (вопрос и варианты A, B) обязателен');
  }
  // вариант C в испанском оригинале пуст → вопрос с двумя вариантами
  const twoOptions = !es.c?.trim();
  if (twoOptions && input.correct === 'c') throw new ValidationError('Вариантов два, а правильным указан C');
  const db = await getDb();
  return db.tx(async (q) => {
    let id = input.id;
    if (id) {
      const r = await q.query(
        `update questions set correct=$2, image_url=$3, topic=$4, rights_status=$5, source=$6, is_active=$7, updated_at=now()
          where id=$1 returning id`,
        [id, input.correct, input.image_url || null, input.topic || null, input.rights_status as RightsStatus, input.source || null, input.is_active],
      );
      if (!r.length) throw new ValidationError('Вопрос не найден');
    } else {
      const r = await q.query(
        `insert into questions (correct, image_url, topic, rights_status, source, is_active)
         values ($1,$2,$3,$4,$5,$6) returning id`,
        [input.correct, input.image_url || null, input.topic || null, input.rights_status, input.source || 'manual', input.is_active],
      );
      id = r[0].id as string;
    }
    for (const lang of LANGS) {
      const t = input.i18n[lang];
      const filled = t && (t.text?.trim() || t.a?.trim() || t.b?.trim() || t.c?.trim() || t.explanation?.trim());
      if (!filled) {
        if (lang !== 'es') await q.query('delete from question_translations where question_id=$1 and lang=$2', [id, lang]);
        continue;
      }
      if (!t!.text?.trim() || !t!.a?.trim() || !t!.b?.trim() || (!twoOptions && !t!.c?.trim())) {
        throw new ValidationError(`Язык ${lang.toUpperCase()}: заполните вопрос и все варианты (или очистите всё поле языка)`);
      }
      await q.query(
        `insert into question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
         values ($1,$2,$3,$4,$5,$6,$7,$8)
         on conflict (question_id, lang) do update set
           text=excluded.text, option_a=excluded.option_a, option_b=excluded.option_b, option_c=excluded.option_c,
           explanation=excluded.explanation, status=excluded.status, updated_at=now()`,
        [id, lang, t!.text.trim(), t!.a.trim(), t!.b.trim(), twoOptions ? '' : t!.c.trim(), t!.explanation?.trim() || null, t!.status === 'reviewed' ? 'reviewed' : 'machine'],
      );
    }
    return id!;
  });
}

// ------------------------------------------------------------------ тесты

export async function listAllTests(category: TestCategory) {
  const db = await getDb();
  return db.query(
    `select t.category, t.number, t.is_active,
            count(tq.question_id)::int as slots,
            count(qs.id) filter (where qs.is_active and (qs.rights_status <> 'unverified' or $2 or t.category = 'mixed'))::int as playable
       from tests t
       left join test_questions tq on tq.test_category = t.category and tq.test_number = t.number
       left join questions qs on qs.id = tq.question_id
      where t.category = $1
      group by t.category, t.number order by t.number`,
    [category, env.serveUnverified],
  );
}

export async function getTestSlots(category: TestCategory, n: number) {
  const db = await getDb();
  return db.query(
    `select tq.position, qs.id as question_id, qs.is_active, qs.rights_status, qs.correct,
            (select text from question_translations t where t.question_id = qs.id and t.lang = 'es') as text_es
       from test_questions tq join questions qs on qs.id = tq.question_id
      where tq.test_category = $1 and tq.test_number = $2 order by tq.position`,
    [category, n],
  );
}

export async function setSlot(category: TestCategory, n: number, position: number, questionId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(questionId)) throw new ValidationError('Неверный ID вопроса');
  if (position < 1 || position > 200) throw new ValidationError('Неверная позиция');
  const db = await getDb();
  await db.tx(async (q) => {
    const ex = await q.query('select 1 from questions where id=$1', [questionId]);
    if (!ex.length) throw new ValidationError('Вопрос с таким ID не найден');
    const dup = await q.query(
      'select position from test_questions where test_category=$1 and test_number=$2 and question_id=$3 and position<>$4',
      [category, n, questionId, position],
    );
    if (dup.length) throw new ValidationError(`Этот вопрос уже стоит в тесте №${n} на позиции ${dup[0].position}`);
    await q.query('insert into tests (category, number) values ($1,$2) on conflict do nothing', [category, n]);
    await q.query(
      `insert into test_questions (test_category, test_number, position, question_id) values ($1,$2,$3,$4)
       on conflict (test_category, test_number, position) do update set question_id = excluded.question_id`,
      [category, n, position, questionId],
    );
  });
}

/**
 * Автосборка тестов из доступных вопросов. Существующие тесты не трогает (заполняет только отсутствующие).
 * Если вопросов меньше, чем слотов (count × size), вопросы повторяются между тестами, но не внутри одного.
 */
export async function buildTests(opts: { count?: number; size?: number; seed?: number } = {}, qx?: Queryable) {
  const count = opts.count ?? TEST_COUNT;
  const size = opts.size ?? TEST_SIZE;
  const db = qx ?? (await getDb());
  const pool = (
    await db.query<{ id: string }>(
      `select qs.id from questions qs
        where qs.is_active and (qs.rights_status <> 'unverified' or $1)
          and exists (select 1 from question_translations t where t.question_id = qs.id and t.lang = 'es')
        order by qs.id`,
      [env.serveUnverified],
    )
  ).map((r) => r.id);
  if (pool.length < size) throw new ValidationError(`Доступных вопросов (${pool.length}) меньше, чем размер теста (${size})`);

  // детерминированное перемешивание
  let s = opts.seed ?? 2026;
  const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  const shuffle = <T,>(a: T[]) => {
    const r = [...a];
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  };

  // buildTests всегда собирает раздел «official» — это основной платный тренажёр из вашего банка
  const existing = new Set(
    (await db.query<{ number: number }>(`select number from tests where category = 'official'`)).map((r) => r.number),
  );
  let queue: string[] = shuffle(pool);
  let created = 0;
  for (let n = 1; n <= count; n++) {
    if (existing.has(n)) continue;
    const chosen: string[] = [];
    const seen = new Set<string>();
    while (chosen.length < size) {
      if (!queue.length) queue = shuffle(pool);
      const id = queue.shift()!;
      if (seen.has(id)) continue; // не допускаем дубли внутри теста (попадёт в следующую перестановку)
      seen.add(id);
      chosen.push(id);
    }
    await db.query(`insert into tests (category, number) values ('official', $1)`, [n]);
    for (let i = 0; i < chosen.length; i++) {
      await db.query(
        `insert into test_questions (test_category, test_number, position, question_id) values ('official',$1,$2,$3)`,
        [n, i + 1, chosen[i]],
      );
    }
    created++;
  }
  return { created, poolSize: pool.length };
}

// ------------------------------------------------------------------ пользователи

export async function listUsers(search: string, page = 1, perPage = 50) {
  const db = await getDb();
  const like = `%${search}%`;
  const rows = await db.query(
    `select ${PROFILE_COLS},
            (select count(*)::int from answer_log a where a.user_id = p.id) as answers,
            (select count(*)::int from test_progress tp where tp.user_id = p.id and tp.passed) as tests_passed,
            (select count(*)::int from user_errors e where e.user_id = p.id and not e.resolved) as errors_open
       from profiles p
      where ($1 = '%%' or coalesce(p.display_name,'') ilike $1 or coalesce(p.telegram_username,'') ilike $1 or p.telegram_id::text like $1)
      order by p.created_at desc
      limit ${perPage} offset ${(page - 1) * perPage}`,
    [like],
  );
  return rows.map((r: any) => ({ ...mapProfile(r), answers: r.answers, tests_passed: r.tests_passed, errors_open: r.errors_open }));
}

export async function listClaims(limit = 100) {
  const db = await getDb();
  return db.query(
    `select c.id, to_char(c.exam_date, 'YYYY-MM-DD') as exam_date, c.result, c.days_added, c.revoked, c.created_at, p.display_name, p.telegram_username, p.id as user_id
       from exam_claims c join profiles p on p.id = c.user_id order by c.created_at desc limit ${limit}`,
  );
}

export async function overview() {
  const db = await getDb();
  const r = (
    await db.query(
      `select
        (select count(*)::int from profiles) as users,
        (select count(*)::int from profiles where access_until > now()) as paid_active,
        (select count(*)::int from payments) as payments,
        (select count(*)::int from questions) as questions,
        (select count(*)::int from questions where rights_status = 'unverified') as unverified,
        (select count(*)::int from questions qs where not exists (select 1 from question_translations t where t.question_id = qs.id and t.lang = 'ru')) as no_ru,
        (select count(*)::int from questions qs where not exists (select 1 from question_translations t where t.question_id = qs.id and t.lang = 'hy')) as no_hy,
        (select count(*)::int from tests) as tests`,
    )
  )[0];
  return r;
}

// ------------------------------------------------------------------ темы и массовые действия

export async function listTopics() {
  const db = await getDb();
  return db.query<{ topic: string | null; n: number }>(
    `select topic, count(*)::int as n from questions group by topic order by (topic is null), lower(topic)`,
  );
}

/** Переименовывает тему; если новое имя уже существует — темы сливаются. Пустое новое имя = «без темы» */
export async function renameTopic(from: string, to: string) {
  const db = await getDb();
  const target = to.trim() || null;
  const r = await db.query('update questions set topic = $2, updated_at = now() where topic = $1 returning id', [from, target]);
  return { updated: r.length };
}

export async function bulkUpdate(
  ids: string[],
  patch: { topic?: string | null; rights_status?: string; is_active?: boolean },
) {
  const clean = ids.filter((i) => /^[0-9a-f-]{36}$/i.test(i));
  if (!clean.length) return { updated: 0 };
  if (patch.rights_status !== undefined && !(RIGHTS_STATUSES as string[]).includes(patch.rights_status)) {
    throw new ValidationError('Неверный статус прав');
  }
  const db = await getDb();
  const setTopic = 'topic' in patch;
  const r = await db.query(
    `update questions set
       topic         = case when $2::boolean then $3 else topic end,
       rights_status = coalesce($4, rights_status),
       is_active     = coalesce($5, is_active),
       updated_at    = now()
     where id = any($1::uuid[]) returning id`,
    [clean, setTopic, setTopic ? patch.topic?.trim() || null : null, patch.rights_status ?? null, patch.is_active ?? null],
  );
  return { updated: r.length };
}

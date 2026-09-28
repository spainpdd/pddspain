/**
 * Импорт / экспорт банка вопросов в собственном формате «dgt-pwa/questions@1».
 * Любой внешний источник сначала приводится к этому формату (скриптом или руками),
 * поэтому здесь нет привязки к конкретному стороннему датасету.
 */
import { getDb, type Queryable } from './db';
import { LANGS, RIGHTS_STATUSES, isChoiceStr, type Lang, type RightsStatus } from './types-io';
import type { TestCategory } from './types';

const TEST_CATEGORIES: TestCategory[] = ['official', 'mixed'];

export const FORMAT = 'dgt-pwa/questions@1';

export interface ImportTranslation {
  text: string;
  a: string;
  b: string;
  c: string;
  explanation?: string | null;
  status?: 'machine' | 'reviewed';
}
export interface ImportQuestion {
  source?: string | null;
  source_ref?: string | null;
  rights_status?: RightsStatus;
  topic?: string | null;
  correct: 'a' | 'b' | 'c';
  image_url?: string | null;
  is_active?: boolean;
  i18n: Partial<Record<Lang, ImportTranslation>>;
}

export interface ImportTest {
  number: number;
  /** official — основной тренажёр (по умолчанию); mixed — дополнительные тесты без ограничений */
  category?: TestCategory;
  source?: string;
  refs: string[]; // source_ref вопросов в порядке позиций
}

const MAX_TEXT = 4000;
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export function validateDoc(doc: unknown): { questions: ImportQuestion[]; tests: ImportTest[]; errors: string[] } {
  const errors: string[] = [];
  const out: ImportQuestion[] = [];
  const tests: ImportTest[] = [];
  const list = Array.isArray(doc) ? doc : (doc as any)?.questions;
  if (!Array.isArray(list)) return { questions: [], tests, errors: ['Ожидается объект {"questions": [...]} или массив вопросов'] };
  for (const t of Array.isArray((doc as any)?.tests) ? (doc as any).tests : []) {
    if (Number.isInteger(t?.number) && t.number >= 1 && Array.isArray(t.refs) && t.refs.every((r: unknown) => typeof r === 'string')) {
      tests.push({
        number: t.number,
        category: TEST_CATEGORIES.includes(t.category) ? t.category : 'official',
        source: typeof t.source === 'string' ? t.source : undefined,
        refs: t.refs,
      });
    } else errors.push(`тест ${t?.number ?? '?'}: нужен number ≥ 1 и refs: string[]`);
  }

  list.forEach((raw: any, idx: number) => {
    const where = `#${idx + 1}${raw?.source_ref ? ` (${raw.source_ref})` : ''}`;
    if (!raw || typeof raw !== 'object') return errors.push(`${where}: не объект`);
    if (!isChoiceStr(raw.correct)) return errors.push(`${where}: correct должен быть a, b или c`);
    const i18n: ImportQuestion['i18n'] = {};
    let bad = false;
    // вопрос с двумя вариантами: в испанском оригинале нет варианта C — тогда его нет и в переводах
    const twoOptions = !str(raw.i18n?.es?.c);
    if (twoOptions && raw.correct === 'c') return errors.push(`${where}: вариантов два, а правильным указан C`);
    for (const lang of LANGS) {
      const t = raw.i18n?.[lang];
      if (!t) continue;
      const item = { text: str(t.text), a: str(t.a), b: str(t.b), c: str(t.c) };
      if (!item.text || !item.a || !item.b || (!twoOptions && !item.c)) {
        errors.push(`${where}: язык ${lang} заполнен не полностью (нужны text, a, b${twoOptions ? '' : ', c'})`);
        bad = true;
        continue;
      }
      if ([item.text, item.a, item.b, item.c].some((s) => s.length > MAX_TEXT)) {
        errors.push(`${where}: язык ${lang}: слишком длинный текст`);
        bad = true;
        continue;
      }
      i18n[lang] = {
        ...item,
        explanation: str(t.explanation) || null,
        status: t.status === 'reviewed' ? 'reviewed' : 'machine',
      };
    }
    if (bad) return;
    if (!i18n.es) return errors.push(`${where}: нет испанского оригинала (i18n.es)`);
    const rights = RIGHTS_STATUSES.includes(raw.rights_status) ? raw.rights_status : 'unverified';
    out.push({
      source: str(raw.source) || null,
      source_ref: str(raw.source_ref) || null,
      rights_status: rights,
      topic: str(raw.topic) || null,
      correct: raw.correct,
      image_url: str(raw.image_url) || null,
      is_active: raw.is_active === false ? false : true,
      i18n,
    });
  });
  return { questions: out, tests, errors };
}

async function writeTranslations(q: Queryable, id: string, i18n: ImportQuestion['i18n']) {
  for (const lang of LANGS) {
    const t = i18n[lang];
    if (!t) continue;
    await q.query(
      `insert into question_translations (question_id, lang, text, option_a, option_b, option_c, explanation, status)
       values ($1,$2,$3,$4,$5,$6,$7,$8)
       on conflict (question_id, lang) do update set
         text = excluded.text, option_a = excluded.option_a, option_b = excluded.option_b,
         option_c = excluded.option_c, explanation = excluded.explanation,
         status = excluded.status, updated_at = now()`,
      [id, lang, t.text, t.a, t.b, t.c, t.explanation ?? null, t.status ?? 'machine'],
    );
  }
}

export async function importQuestions(items: ImportQuestion[]) {
  const db = await getDb();
  const res = { inserted: 0, updated: 0 };
  await db.tx(async (q) => {
    for (const it of items) {
      let id: string | null = null;
      if (it.source && it.source_ref) {
        const ex = await q.query('select id from questions where source = $1 and source_ref = $2', [it.source, it.source_ref]);
        id = ex[0]?.id ?? null;
      }
      if (id) {
        await q.query(
          `update questions set correct=$2, image_url=$3, topic=$4, rights_status=$5, is_active=$6, updated_at=now() where id=$1`,
          [id, it.correct, it.image_url ?? null, it.topic ?? null, it.rights_status ?? 'unverified', it.is_active ?? true],
        );
        res.updated++;
      } else {
        const r = await q.query(
          `insert into questions (correct, image_url, topic, rights_status, source, source_ref, is_active)
           values ($1,$2,$3,$4,$5,$6,$7) returning id`,
          [it.correct, it.image_url ?? null, it.topic ?? null, it.rights_status ?? 'unverified', it.source ?? null, it.source_ref ?? null, it.is_active ?? true],
        );
        id = r[0].id;
        res.inserted++;
      }
      await writeTranslations(q, id!, it.i18n);
    }
  });
  return res;
}

/** Расставляет вопросы по тестам. Существующие непустые тесты не трогает, пока не передан overwrite */
export async function importTests(tests: ImportTest[], opts: { overwrite?: boolean; defaultSource?: string } = {}) {
  const db = await getDb();
  const res = { created: 0, skipped: 0, missingRefs: 0 };
  await db.tx(async (q) => {
    for (const t of tests) {
      const category: TestCategory = t.category ?? 'official';
      const has = (
        await q.query('select count(*)::int as n from test_questions where test_category = $1 and test_number = $2', [category, t.number])
      )[0].n;
      if (has && !opts.overwrite) {
        res.skipped++;
        continue;
      }
      const src = t.source ?? opts.defaultSource ?? null;
      const rows = await q.query<{ id: string; source_ref: string }>(
        `select id, source_ref from questions where source_ref = any($1::text[]) and ($2::text is null or source = $2)`,
        [t.refs, src],
      );
      const byRef = new Map(rows.map((r) => [r.source_ref, r.id]));
      await q.query('insert into tests (category, number) values ($1,$2) on conflict do nothing', [category, t.number]);
      await q.query('delete from test_questions where test_category = $1 and test_number = $2', [category, t.number]);
      const used = new Set<string>();
      let pos = 0;
      for (const ref of t.refs) {
        const id = byRef.get(ref);
        if (!id) {
          res.missingRefs++;
          continue;
        }
        if (used.has(id)) continue;
        used.add(id);
        await q.query(
          'insert into test_questions (test_category, test_number, position, question_id) values ($1,$2,$3,$4)',
          [category, t.number, ++pos, id],
        );
      }
      res.created++;
    }
  });
  return res;
}

export async function exportQuestions() {
  const db = await getDb();
  const qs = await db.query('select * from questions order by created_at, source_ref nulls last, id');
  const tr = await db.query('select * from question_translations');
  const by = new Map<string, any>();
  for (const t of tr) {
    const m = by.get(t.question_id) ?? {};
    m[t.lang] = { text: t.text, a: t.option_a, b: t.option_b, c: t.option_c, explanation: t.explanation, status: t.status };
    by.set(t.question_id, m);
  }
  const tq = await db.query(
    `select tq.test_category, tq.test_number, tq.position, coalesce(qs.source_ref, qs.id::text) as ref
       from test_questions tq join questions qs on qs.id = tq.question_id
      order by tq.test_category, tq.test_number, tq.position`,
  );
  const tmap = new Map<string, string[]>();
  for (const r of tq as any[]) {
    const key = `${r.test_category}:${r.test_number}`;
    tmap.set(key, [...(tmap.get(key) ?? []), r.ref]);
  }
  return {
    format: FORMAT,
    exported_at: new Date().toISOString(),
    tests: [...tmap].map(([key, refs]) => {
      const [category, number] = key.split(':');
      return { number: Number(number), category, refs };
    }),
    questions: qs.map((q: any) => ({
      source: q.source, source_ref: q.source_ref ?? q.id, rights_status: q.rights_status, topic: q.topic,
      correct: q.correct, image_url: q.image_url, is_active: q.is_active, i18n: by.get(q.id) ?? {},
    })),
  };
}

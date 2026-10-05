import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Db } from '../lib/db';
import { makeDb, seedContent } from './helpers';
import { setDb } from '../lib/db';
import { getPublicPage, listPublicUseful } from '../lib/repo/useful';
import { getTestQuestions } from '../lib/repo/content';
import { orderTests } from '../lib/engine';
import Blocks from '../components/useful/Blocks';

const ROOT = path.join(__dirname, '..');
const SECTION = 'Изменения ПДД с 1.10.26';
let db: Db;
beforeEach(async () => {
  db = await makeDb({ seed: true });
});
afterEach(async () => {
  await db.close();
});

describe('вопросы по изменениям ПДД с 1.10.26 (миграция 009)', () => {
  it('73 вопроса, все на четырёх языках, с объяснением', async () => {
    const n = (await db.query(`select count(*)::int n from questions where source = 'rd518-2026'`))[0].n;
    expect(n).toBe(73);
    const bad = await db.query(
      `select q.source_ref, count(t.lang)::int c
         from questions q left join question_translations t on t.question_id = q.id
          and t.text <> '' and t.option_a <> '' and t.option_b <> '' and t.option_c <> '' and coalesce(t.explanation, '') <> ''
        where q.source = 'rd518-2026' group by q.source_ref having count(t.lang) <> 4`,
    );
    expect(bad).toEqual([]);
    const st = await db.query(`select t.lang, t.status, count(*)::int n from question_translations t join questions q on q.id = t.question_id where q.source = 'rd518-2026' group by 1, 2 order by 1`);
    expect(st.find((r: any) => r.lang === 'hy')!.status).toBe('machine');
    expect(st.find((r: any) => r.lang === 'ru')!.status).toBe('reviewed');
  });

  it('вопросы собственные, активные, с вариантами a/b/c и разумным распределением ответов', async () => {
    const rows = await db.query(`select correct, rights_status, is_active, topic from questions where source = 'rd518-2026'`);
    expect(rows.every((r: any) => r.rights_status === 'own' && r.is_active && r.topic)).toBe(true);
    for (const c of ['a', 'b', 'c']) expect(rows.filter((r: any) => r.correct === c).length).toBeGreaterThan(15);
  });

  it('12 иллюстраций прикреплены к вопросам, файлы лежат в public/new-rules', async () => {
    const rows = await db.query(`select image_url from questions where source = 'rd518-2026' and image_url is not null order by image_url`);
    expect(rows.length).toBe(12);
    for (const r of rows) expect(fs.existsSync(path.join(ROOT, 'public', r.image_url)), r.image_url).toBe(true);
  });

  it('три новых теста стоят в конце курса и вместе дают 73 вопроса в исходном порядке', async () => {
    const tests = await db.query(`select category, number, title from tests order by category, number`);
    const ordered = orderTests(tests as any);
    const tail = ordered.slice(-3);
    expect(tail.map((t: any) => t.title)).toEqual(['ПДД с 1.10.26 · часть 1', 'ПДД с 1.10.26 · часть 2', 'ПДД с 1.10.26 · часть 3']);
    expect(tail.every((t: any) => t.category === 'mixed')).toBe(true);
    const sizes: number[] = [];
    const refs: string[] = [];
    for (const t of tail) {
      const qs = await getTestQuestions(t.category, t.number);
      sizes.push(qs.length);
      const r = await db.query(
        `select q.source_ref from test_questions tq join questions q on q.id = tq.question_id
          where tq.test_category = $1 and tq.test_number = $2 order by tq.position`,
        [t.category, t.number],
      );
      refs.push(...r.map((x: any) => x.source_ref));
    }
    expect(sizes).toEqual([25, 24, 24]);
    expect(refs).toEqual(Array.from({ length: 73 }, (_, i) => String(i + 1).padStart(3, '0')));
  });

  it('если mixed-тесты уже есть, новые продолжают нумерацию', async () => {
    const mx = await db.query(`select number from tests where category = 'mixed' order by number`);
    expect(mx.map((r: any) => r.number)).toEqual([1, 2, 3]);
    const sql = fs.readFileSync(path.join(ROOT, 'supabase', 'migrations', '009_new_rules_2026.sql'), 'utf8');
    // чистая база с 5 уже существующими mixed-тестами
    const db2 = await makeDb();
    await seedContent(db2, { tests: 5, size: 2, category: 'mixed' });
    await db2.exec(sql);
    const nums = await db2.query(`select number from tests where category = 'mixed' and title like 'ПДД%' order by number`);
    expect(nums.map((r: any) => r.number)).toEqual([6, 7, 8]);
    await db2.close();
    setDb(db);
  });

  it('повторный запуск миграции ничего не дублирует', async () => {
    const sql = fs.readFileSync(path.join(ROOT, 'supabase', 'migrations', '009_new_rules_2026.sql'), 'utf8');
    await db.exec(sql);
    expect((await db.query(`select count(*)::int n from questions where source = 'rd518-2026'`))[0].n).toBe(73);
    expect((await db.query(`select count(*)::int n from question_translations t join questions q on q.id = t.question_id where q.source = 'rd518-2026'`))[0].n).toBe(292);
    expect((await db.query(`select count(*)::int n from tests where title like 'ПДД с 1.10.26%'`))[0].n).toBe(3);
    expect((await db.query(`select count(*)::int n from test_questions tq join questions q on q.id = tq.question_id where q.source = 'rd518-2026'`))[0].n).toBe(73);
    expect((await db.query(`select count(*)::int n from useful_sections where title->>'ru' = $1`, [SECTION]))[0].n).toBe(1);
  });

  it('вопрос про норму 2027 года помечен датой', async () => {
    const r = await db.query(
      `select t.lang, t.text from question_translations t join questions q on q.id = t.question_id where q.source = 'rd518-2026' and q.source_ref = '033'`,
    );
    expect(r.length).toBe(4);
    for (const x of r) expect(x.text, x.lang).toMatch(/2027/);
  });

  it('в текстах нет служебных следов исходного приложения', async () => {
    const rows = await db.query(`select t.text, t.explanation from question_translations t join questions q on q.id = t.question_id where q.source = 'rd518-2026'`);
    for (const r of rows) expect(`${r.text} ${r.explanation}`).not.toMatch(/\$t\$|undefined|null|TODO/);
  });
});

describe('раздел «Полезно»: «Изменения ПДД с 1.10.26»', () => {
  it('7 страниц в нужном порядке; раздел стоит первым', async () => {
    const groups = await listPublicUseful('ru');
    expect(groups[0].title).toBe(SECTION);
    expect(groups[0].pages.map((p) => p.slug)).toEqual([
      'izm-obzor', 'izm-velo-sim', 'izm-moto', 'izm-peshehody', 'izm-voditeli', 'izm-prochee', 'izm-shpargalka',
    ]);
  });

  it('страницы отрисовываются, картинки существуют, внутренние ссылки живые', async () => {
    const groups = await listPublicUseful('ru');
    const pages = groups.find((x) => x.title === SECTION)!.pages;
    const slugs = new Set(groups.flatMap((g) => g.pages.map((p) => p.slug)));
    for (const p of pages) {
      const page = await getPublicPage(p.slug, 'ru');
      expect(page, p.slug).not.toBeNull();
      const html = renderToStaticMarkup(<Blocks blocks={page!.blocks} storageId={p.slug} />);
      expect(html.length).toBeGreaterThan(500);
      for (const b of page!.blocks) if (b.type === 'image') expect(fs.existsSync(path.join(ROOT, 'public', b.url)), b.url).toBe(true);
      const text = JSON.stringify(page!.blocks);
      for (const m of text.matchAll(/\]\(\/useful\/([a-z0-9-]+)\)/g)) expect(slugs.has(m[1]), `${p.slug} → ${m[1]}`).toBe(true);
    }
  });
});

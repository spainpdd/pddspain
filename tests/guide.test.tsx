import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Db } from '../lib/db';
import { makeDb } from './helpers';
import { getPublicPage, listPublicUseful } from '../lib/repo/useful';
import Blocks from '../components/useful/Blocks';

let db: Db;
beforeEach(async () => {
  db = await makeDb();
});
afterEach(async () => {
  await db.close();
});

describe('стартовый гайд «Права в Испании»', () => {
  it('миграция создаёт раздел и 8 опубликованных страниц, в порядке', async () => {
    const groups = await listPublicUseful('ru');
    const g = groups.find((x) => x.title === 'Права в Испании');
    expect(g).toBeTruthy();
    expect(g!.pages.map((p) => p.slug)).toEqual([
      'gid-prava-start', 'gid-obmen-prav', 'gid-prava-s-nulya', 'gid-teoriya',
      'gid-praktika', 'gid-posle-ekzamena', 'gid-dengi-i-sroki', 'gid-ispanskiy-dlya-praktiki',
    ]);
  });

  it('каждая страница отрисовывается, а картинки существуют в public/useful', async () => {
    const groups = await listPublicUseful('ru');
    for (const p of groups.find((x) => x.title === 'Права в Испании')!.pages) {
      const page = await getPublicPage(p.slug, 'ru');
      expect(page, p.slug).not.toBeNull();
      expect(page!.blocks.length).toBeGreaterThan(3);
      const html = renderToStaticMarkup(<Blocks blocks={page!.blocks} storageId={p.slug} />);
      expect(html.length).toBeGreaterThan(500);
      for (const b of page!.blocks) {
        if (b.type === 'image') expect(fs.existsSync(path.join(__dirname, '..', 'public', b.url)), b.url).toBe(true);
      }
    }
  });

  it('все внутренние ссылки между страницами ведут на существующие адреса', async () => {
    const slugs = new Set((await listPublicUseful('ru')).flatMap((g) => g.pages.map((p) => p.slug)));
    for (const slug of slugs) {
      const page = await getPublicPage(slug, 'ru');
      const text = JSON.stringify(page!.blocks);
      for (const m of text.matchAll(/\]\(\/useful\/([a-z0-9-]+)\)/g)) expect(slugs.has(m[1]), `${slug} → ${m[1]}`).toBe(true);
    }
  });

  it('повторный запуск миграции ничего не дублирует и не затирает правки', async () => {
    await db.query(`update useful_pages set title = jsonb_set(title, '{ru}', '"Моя правка"') where slug = 'gid-teoriya'`);
    const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'migrations', '008_guide_prava.sql'), 'utf8');
    await db.exec(sql);
    expect((await db.query('select count(*)::int n from useful_pages where slug like $1', ['gid-%']))[0].n).toBe(8);
    expect((await db.query('select count(*)::int n from useful_sections where title->>$1 = $2', ['ru', 'Права в Испании']))[0].n).toBe(1);
    expect((await getPublicPage('gid-teoriya', 'ru'))!.title).toBe('Моя правка');
  });
});

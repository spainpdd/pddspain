import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Db } from '../lib/db';
import { makeDb, seedContent, makeUser, answersWithErrors } from './helpers';
import { upsertTelegramUser } from '../lib/repo/users';
import {
  cleanBlock, cleanBlocks, safeUrl, slugify, youtubeId, pickText, pickBlocks,
} from '../lib/useful';
import {
  deleteUsefulPage, deleteUsefulSection, getPublicPage, getUsefulPage, listPublicUseful, listUsefulAdmin,
  moveUsefulPage, saveUsefulPage, saveUsefulSection,
} from '../lib/repo/useful';
import { adminClearCheckpoint, listAudit } from '../lib/repo/admin-users';
import { getCourse } from '../lib/repo/content';
import { submitTest } from '../lib/repo/progress';
import { ValidationError } from '../lib/repo/admin';
import Blocks from '../components/useful/Blocks';

describe('разбор и очистка блоков', () => {
  it('youtubeId понимает основные формы ссылок и отвергает чужое', () => {
    const id = 'dQw4w9WgXcQ';
    for (const u of [
      `https://www.youtube.com/watch?v=${id}`, `https://youtube.com/watch?feature=x&v=${id}`, `https://youtu.be/${id}?t=5`,
      `https://www.youtube.com/shorts/${id}`, `https://www.youtube.com/embed/${id}`, `http://m.youtube.com/watch?v=${id}`,
    ]) expect(youtubeId(u)).toBe(id);
    expect(youtubeId('https://vimeo.com/123456789')).toBeNull();
    expect(youtubeId('https://evil.com/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(youtubeId('javascript:alert(1)')).toBeNull();
  });

  it('safeUrl пропускает только http(s), а mailto/tel и относительные — по разрешению', () => {
    expect(safeUrl('https://a.b/c')).toBe('https://a.b/c');
    expect(safeUrl('javascript:alert(1)')).toBe('');
    expect(safeUrl('data:text/html,<script>')).toBe('');
    expect(safeUrl('//evil.com/x', { allowRelative: true })).toBe('');
    expect(safeUrl('/uploads/a.png', { allowRelative: true })).toBe('/uploads/a.png');
    expect(safeUrl('/uploads/a.png')).toBe('');
    expect(safeUrl('mailto:a@b.es', { allowContact: true })).toBe('mailto:a@b.es');
    expect(safeUrl('mailto:a@b.es')).toBe('');
  });

  it('cleanBlock отбрасывает пустое и негодное, обрезает лишнее', () => {
    expect(cleanBlock({ type: 'text', text: '   ' })).toBeNull();
    expect(cleanBlock({ type: 'nope' })).toBeNull();
    expect(cleanBlock(null)).toBeNull();
    expect(cleanBlock({ type: 'image', url: 'javascript:alert(1)' })).toBeNull();
    expect(cleanBlock({ type: 'video', url: 'https://vimeo.com/1' })).toBeNull();
    expect(cleanBlock({ type: 'link', label: 'Go', url: 'javascript:alert(1)' })).toBeNull();
    expect(cleanBlock({ type: 'callout', tone: 'weird', text: 'x' })).toEqual({ type: 'callout', tone: 'info', text: 'x' });
    expect(cleanBlock({ type: 'steps', items: [{ title: '', text: '' }] })).toBeNull();
    expect(cleanBlock({ type: 'steps', items: [{ title: 'A' }, { title: '', text: 'b' }] })).toEqual({ type: 'steps', items: [{ title: 'A' }, { title: '', text: 'b' }] });
    expect(cleanBlock({ type: 'checklist', items: ['a', '', ' b '] })).toEqual({ type: 'checklist', items: ['a', 'b'] });
    expect(cleanBlock({ type: 'faq', items: [{ q: 'q', a: '' }] })).toBeNull();
    expect(cleanBlock({ type: 'text', text: 'x'.repeat(30_000) })).toMatchObject({ text: expect.stringMatching(/^x{20000}$/) });
  });

  it('таблица: выравнивает строки по числу колонок, пустые строки убирает', () => {
    expect(cleanBlock({ type: 'table', headers: ['Страна', 'Срок'], rows: [['ES'], ['', ''], ['FR', '6 мес', 'лишнее']] })).toEqual({
      type: 'table', headers: ['Страна', 'Срок'], rows: [['ES', ''], ['FR', '6 мес']],
    });
    expect(cleanBlock({ type: 'table', headers: ['A'], rows: [] })).toBeNull();
  });

  it('cleanBlocks ограничивает число блоков и терпит мусор', () => {
    expect(cleanBlocks('x')).toEqual([]);
    expect(cleanBlocks(Array.from({ length: 300 }, () => ({ type: 'divider' })))).toHaveLength(200);
  });

  it('slugify: русский → латиница, пустое → material', () => {
    expect(slugify('Как получить медсправку?')).toBe('kak-poluchit-medspravku');
    expect(slugify('Права из других стран (ЕС)')).toBe('prava-iz-drugih-stran-es');
    expect(slugify('!!!')).toBe('material');
    expect(slugify('Ա'.repeat(5))).toBe('material');
  });

  it('язык: армянский, если есть, иначе русский', () => {
    expect(pickText({ ru: 'Привет', hy: 'Բարեւ' }, 'hy')).toBe('Բարեւ');
    expect(pickText({ ru: 'Привет', hy: ' ' }, 'hy')).toBe('Привет');
    expect(pickBlocks({ ru: [{ type: 'divider' }], hy: [] }, 'hy')).toHaveLength(1);
  });
});

describe('показ блоков (без опасного HTML)', () => {
  it('ссылки с javascript: превращаются в обычный текст, внешние открываются безопасно', () => {
    const html = renderToStaticMarkup(
      <Blocks blocks={[{ type: 'text', text: '[плохо](javascript:alert(1)) и [хорошо](https://dgt.es) **жирный**\n\n# Заголовок\n\n- один\n- два' }]} />,
    );
    expect(html).not.toContain('javascript:');
    expect(html).toContain('href="https://dgt.es"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('<strong');
    expect(html).toContain('<h2');
    expect(html).toContain('<li>один</li>');
  });

  it('HTML в тексте экранируется', () => {
    const html = renderToStaticMarkup(<Blocks blocks={[{ type: 'text', text: '<img src=x onerror=alert(1)>' }]} />);
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });

  it('видео встраивается через youtube-nocookie, таблица и шаги рисуются', () => {
    const html = renderToStaticMarkup(
      <Blocks
        blocks={[
          { type: 'video', url: 'https://youtu.be/dQw4w9WgXcQ', caption: 'Урок' },
          { type: 'table', headers: ['A', 'B'], rows: [['1', '2']] },
          { type: 'steps', items: [{ title: 'Первый' }, { title: 'Второй', text: 'детали' }] },
          { type: 'faq', items: [{ q: 'Вопрос?', a: 'Ответ' }] },
        ]}
      />,
    );
    expect(html).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(html).toContain('<table');
    expect(html).toContain('Второй');
    expect(html).toContain('<details');
  });
});

describe('материалы «Полезно»', () => {
  let db: Db;
  let admin: Awaited<ReturnType<typeof upsertTelegramUser>>;
  beforeEach(async () => {
    db = await makeDb();
    admin = await upsertTelegramUser({ id: 1, first_name: 'Boss', username: 'boss' });
    admin = { ...admin, is_admin: true };
  });
  afterEach(async () => {
    await db.close();
  });

  const page = (over: Record<string, unknown> = {}) => ({
    title: { ru: 'Медицинская справка', hy: '' },
    summary: { ru: 'Где и как сделать', hy: '' },
    icon: '🩺',
    blocks: { ru: [{ type: 'text', text: 'Идите в центр.' }], hy: [] },
    ...over,
  });

  it('создаёт черновик с адресом из заголовка; черновик пользователям не виден', async () => {
    const r = await saveUsefulPage(admin, page());
    expect(r.slug).toBe('meditsinskaya-spravka');
    expect(await listPublicUseful('ru')).toEqual([]);
    expect(await getPublicPage(r.slug, 'ru')).toBeNull();
    const saved = await getUsefulPage(r.id);
    expect(saved).toMatchObject({ status: 'draft', icon: '🩺', slug: r.slug });
    expect(saved!.blocks.ru).toEqual([{ type: 'text', text: 'Идите в центр.' }]);
  });

  it('опубликованный виден; армянский откатывается на русский, пока не заполнен', async () => {
    const r = await saveUsefulPage(admin, page({ status: 'published' }));
    const ru = await getPublicPage(r.slug, 'ru');
    expect(ru).toMatchObject({ title: 'Медицинская справка', icon: '🩺' });
    const hyFallback = await getPublicPage(r.slug, 'hy');
    expect(hyFallback!.title).toBe('Медицинская справка');
    expect(hyFallback!.blocks).toHaveLength(1);
    await saveUsefulPage(admin, page({ id: r.id, status: 'published', title: { ru: 'Медицинская справка', hy: 'Բժշկական տեղեկանք' }, blocks: { ru: [{ type: 'text', text: 'Идите в центр.' }], hy: [{ type: 'text', text: 'Գնացեք կենտրոն։' }] } }));
    const hy = await getPublicPage(r.slug, 'hy');
    expect(hy!.title).toBe('Բժշկական տեղեկանք');
    expect(hy!.blocks).toEqual([{ type: 'text', text: 'Գնացեք կենտրոն։' }]);
  });

  it('снятие с публикации скрывает материал; адрес при правке не меняется', async () => {
    const r = await saveUsefulPage(admin, page({ status: 'published' }));
    const r2 = await saveUsefulPage(admin, page({ id: r.id, status: 'draft', title: { ru: 'Совсем другой заголовок' } }));
    expect(r2.slug).toBe(r.slug);
    expect(await getPublicPage(r.slug, 'ru')).toBeNull();
  });

  it('проверки: нужен русский заголовок, адрес уникален, раздел должен существовать', async () => {
    await expect(saveUsefulPage(admin, page({ title: { ru: ' ', hy: 'Ա' } }))).rejects.toBeInstanceOf(ValidationError);
    await expect(saveUsefulPage(admin, page({ blocks: { ru: [], hy: [{ type: 'text', text: 'x' }] } }))).rejects.toBeInstanceOf(ValidationError);
    await expect(saveUsefulPage(admin, page({ slug: 'Плохой Адрес' }))).rejects.toBeInstanceOf(ValidationError);
    await expect(saveUsefulPage(admin, page({ section_id: '00000000-0000-0000-0000-000000000000' }))).rejects.toBeInstanceOf(ValidationError);
    const a = await saveUsefulPage(admin, page({ slug: 'one' }));
    const b = await saveUsefulPage(admin, page({ slug: 'two' }));
    await expect(saveUsefulPage(admin, page({ id: b.id, slug: 'one' }))).rejects.toThrow(/занят/);
    // автоадрес при совпадении получает суффикс
    const c = await saveUsefulPage(admin, page({ title: { ru: 'Один' } }));
    const d = await saveUsefulPage(admin, page({ title: { ru: 'Один' } }));
    expect(c.slug).toBe('odin');
    expect(d.slug).toBe('odin-2');
    expect(a.slug).toBe('one');
  });

  it('мусор в блоках не сохраняется', async () => {
    const r = await saveUsefulPage(admin, page({ blocks: { ru: [{ type: 'text', text: 'ok' }, { type: 'image', url: 'javascript:alert(1)' }, { type: 'text', text: '' }, { type: 'bogus' }], hy: [] } }));
    expect((await getUsefulPage(r.id))!.blocks.ru).toEqual([{ type: 'text', text: 'ok' }]);
  });

  it('разделы: группировка и порядок; удаление раздела оставляет материалы', async () => {
    const docs = await saveUsefulSection(admin, { title: { ru: 'Документы', hy: '' } });
    const exam = await saveUsefulSection(admin, { title: { ru: 'Экзамен' } });
    await saveUsefulPage(admin, page({ slug: 'a', status: 'published', section_id: exam }));
    await saveUsefulPage(admin, page({ slug: 'b', status: 'published', section_id: docs }));
    await saveUsefulPage(admin, page({ slug: 'c', status: 'published' }));
    await saveUsefulPage(admin, page({ slug: 'd', status: 'draft', section_id: docs }));
    const groups = await listPublicUseful('ru');
    expect(groups.map((g) => g.title)).toEqual(['Документы', 'Экзамен', null]);
    expect(groups[0].pages.map((p) => p.slug)).toEqual(['b']); // черновик d не виден
    await deleteUsefulSection(admin, docs);
    const after = await listPublicUseful('ru');
    expect(after.map((g) => g.title)).toEqual(['Экзамен', null]);
    expect(after[1].pages.map((p) => p.slug).sort()).toEqual(['b', 'c']);
    await expect(deleteUsefulSection(admin, docs)).rejects.toBeInstanceOf(ValidationError);
  });

  it('порядок материалов меняется стрелками внутри раздела', async () => {
    const a = await saveUsefulPage(admin, page({ slug: 'a', status: 'published' }));
    await saveUsefulPage(admin, page({ slug: 'b', status: 'published' }));
    await saveUsefulPage(admin, page({ slug: 'c', status: 'published' }));
    await moveUsefulPage(admin, a.id, 'down');
    expect((await listPublicUseful('ru'))[0].pages.map((p) => p.slug)).toEqual(['b', 'a', 'c']);
    await moveUsefulPage(admin, a.id, 'down');
    await moveUsefulPage(admin, a.id, 'down'); // дальше края — ничего
    expect((await listPublicUseful('ru'))[0].pages.map((p) => p.slug)).toEqual(['b', 'c', 'a']);
    expect((await listUsefulAdmin()).pages.map((p) => p.slug)).toEqual(['b', 'c', 'a']);
  });

  it('удаление и журнал действий', async () => {
    const r = await saveUsefulPage(admin, page());
    await deleteUsefulPage(admin, r.id);
    expect(await getUsefulPage(r.id)).toBeNull();
    await expect(deleteUsefulPage(admin, r.id)).rejects.toBeInstanceOf(ValidationError);
    const log = await listAudit({});
    expect(log.rows.map((x) => x.action)).toEqual(expect.arrayContaining(['useful_save', 'useful_delete']));
  });
});

describe('админ засчитывает проверку вручную', () => {
  let db: Db;
  beforeEach(async () => {
    db = await makeDb();
  });
  afterEach(async () => {
    await db.close();
  });

  it('открывает следующий тест и пишется в журнал; повторно нельзя', async () => {
    const ids = await seedContent(db, { tests: 12 });
    const admin = await upsertTelegramUser({ id: 1, first_name: 'Boss' });
    const u = await makeUser();
    for (let n = 1; n <= 10; n++) await submitTest(u.id, 'official', n, answersWithErrors(ids[n - 1], 0));
    expect((await getCourse(u.id)).tests[10].status).toBe('locked');
    await adminClearCheckpoint({ ...admin, is_admin: true }, u.id, 10);
    const c = await getCourse(u.id);
    expect(c.tests[10].status).toBe('available');
    expect(c.checkpoints[0].status).toBe('passed');
    await expect(adminClearCheckpoint({ ...admin, is_admin: true }, u.id, 10)).rejects.toThrow(/уже сдана/);
    await expect(adminClearCheckpoint({ ...admin, is_admin: true }, u.id, 7)).rejects.toThrow(/нет в курсе/);
    expect((await listAudit({ user: u.id })).rows[0]).toMatchObject({ action: 'checkpoint_clear', details: { milestone: 10 } });
  });
});

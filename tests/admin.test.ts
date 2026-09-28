import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import type { Db } from '../lib/db';
import { makeDb, seedContent } from './helpers';
import { validateDoc, importQuestions, exportQuestions } from '../lib/questions-io';
import { buildTests, listQuestions, saveQuestion, getQuestionFull, setSlot, listAllTests, ValidationError, getTestSlots } from '../lib/repo/admin';
import { getTestQuestions, listTests } from '../lib/repo/content';
import { makeUser } from './helpers';

let db: Db;
beforeEach(async () => { db = await makeDb(); });
afterEach(async () => { await db.close(); });

const seed = () => JSON.parse(fs.readFileSync('data/seed-questions.json', 'utf8'));

describe('формат импорта', () => {
  it('стартовый набор валиден: 30 вопросов, 4 языка, без ошибок', () => {
    const { questions, errors } = validateDoc(seed());
    expect(errors).toEqual([]);
    expect(questions).toHaveLength(30);
    for (const q of questions) {
      expect(Object.keys(q.i18n).sort()).toEqual(['en', 'es', 'hy', 'ru']);
      expect(q.rights_status).toBe('own');
    }
  });

  it('ответы в стартовом наборе распределены равномерно (по 10 на A/B/C)', () => {
    const { questions } = validateDoc(seed());
    const c = { a: 0, b: 0, c: 0 } as Record<string, number>;
    questions.forEach((q) => c[q.correct]++);
    expect(c).toEqual({ a: 10, b: 10, c: 10 });
  });

  it('находит ошибки: нет es, неполный язык, неверный correct; неизвестные права → unverified', () => {
    const r = validateDoc({ questions: [
      { correct: 'x', i18n: { es: { text: 't', a: 'a', b: 'b', c: 'c' } } },
      { correct: 'a', i18n: { en: { text: 't', a: 'a', b: 'b', c: 'c' } } },
      { correct: 'a', i18n: { es: { text: 't', a: 'a', b: '', c: 'c' } } },
      { correct: 'a', rights_status: 'whatever', i18n: { es: { text: 't', a: 'a', b: 'b', c: 'c' } } },
    ] });
    expect(r.errors).toHaveLength(3);
    expect(r.questions).toHaveLength(1);
    expect(r.questions[0].rights_status).toBe('unverified');
    expect(validateDoc('nope').errors).toHaveLength(1);
  });

  it('импорт идемпотентен по (source, source_ref); экспорт возвращает то же самое', async () => {
    const { questions } = validateDoc(seed());
    expect(await importQuestions(questions)).toEqual({ inserted: 30, updated: 0 });
    expect(await importQuestions(questions)).toEqual({ inserted: 0, updated: 30 });
    const exp = await exportQuestions();
    expect(exp.questions).toHaveLength(30);
    const again = validateDoc(exp);
    expect(again.errors).toEqual([]);
    expect(again.questions[0].i18n.hy!.text).toBe(questions[0].i18n.hy!.text);
  });
});

describe('автосборка тестов', () => {
  it('из 30 вопросов делает 90 тестов по 30, без дублей внутри теста; повторный запуск ничего не меняет', async () => {
    await importQuestions(validateDoc(seed()).questions);
    const r = await buildTests();
    expect(r).toEqual({ created: 90, poolSize: 30 });
    const rows = await db.query('select test_number, count(*)::int n, count(distinct question_id)::int d from test_questions group by test_number');
    expect(rows).toHaveLength(90);
    expect(rows.every((x: any) => x.n === 30 && x.d === 30)).toBe(true);
    expect((await buildTests()).created).toBe(0);
  });

  it('вопросы распределяются по тестам; при большом банке дублей между тестами почти нет', async () => {
    // 300 вопросов → 90 тестов × 30 = 2700 слотов: каждый вопрос ≈ 9 раз, но не подряд и не внутри теста
    await seedContent(db, { tests: 0 });
    for (let i = 0; i < 300; i++) {
      const q = (await db.query(`insert into questions (correct, rights_status) values ('a','own') returning id`))[0];
      await db.query(`insert into question_translations (question_id, lang, text, option_a, option_b, option_c) values ($1,'es','t','a','b','c')`, [q.id]);
    }
    const r = await buildTests({ count: 10 });
    expect(r.created).toBe(10);
    const d = await db.query('select count(distinct question_id)::int n from test_questions');
    expect(d[0].n).toBe(300); // 10 тестов × 30 = 300 слотов — все разные
  });

  it('unverified-вопросы не попадают в автосборку', async () => {
    const items = validateDoc(seed()).questions.map((q) => ({ ...q, rights_status: 'unverified' as const }));
    await importQuestions(items);
    await expect(buildTests()).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('редактирование вопроса в админке', () => {
  it('создание, правка любого поля и перевода, очистка языка', async () => {
    const id = await saveQuestion({
      correct: 'b', rights_status: 'own', is_active: true, topic: 'test',
      i18n: { es: { text: 'Pregunta', a: 'A', b: 'B', c: 'C', explanation: 'E' }, ru: { text: 'Вопрос', a: 'А', b: 'Б', c: 'В' } },
    });
    let f = (await getQuestionFull(id))!;
    expect(Object.keys(f.translations).sort()).toEqual(['es', 'ru']);

    await saveQuestion({
      id, correct: 'c', rights_status: 'licensed', is_active: false, image_url: 'https://x/y.png',
      i18n: { es: { text: 'Pregunta 2', a: 'A', b: 'B', c: 'C' }, ru: { text: '', a: '', b: '', c: '' }, hy: { text: 'Հ', a: '1', b: '2', c: '3', status: 'reviewed' } },
    });
    f = (await getQuestionFull(id))!;
    expect(f.question).toMatchObject({ correct: 'c', rights_status: 'licensed', is_active: false, image_url: 'https://x/y.png' });
    expect(f.translations.es.text).toBe('Pregunta 2');
    expect(f.translations.ru).toBeUndefined();
    expect(f.translations.hy.status).toBe('reviewed');
  });

  it('валидация: нет es, неполный перевод, неверный ответ', async () => {
    const ok = { correct: 'a', rights_status: 'own', is_active: true };
    await expect(saveQuestion({ ...ok, i18n: {} })).rejects.toBeInstanceOf(ValidationError);
    await expect(saveQuestion({ ...ok, correct: 'z', i18n: { es: { text: 't', a: 'a', b: 'b', c: 'c' } } })).rejects.toBeInstanceOf(ValidationError);
    await expect(saveQuestion({ ...ok, i18n: { es: { text: 't', a: 'a', b: 'b', c: 'c' }, en: { text: 'only text', a: '', b: '', c: '' } } })).rejects.toBeInstanceOf(ValidationError);
    expect((await db.query('select count(*)::int n from questions'))[0].n).toBe(0); // откат
  });

  it('правка вопроса сразу видна в тесте у пользователей (формулировка, вариант, правильный ответ)', async () => {
    const ids = await seedContent(db, { tests: 1 });
    const u = await makeUser();
    const before = await getTestQuestions('official', 1);
    expect(before[0].correct).toBe('a');
    await saveQuestion({
      id: ids[0][0], correct: 'c', rights_status: 'own', is_active: true,
      i18n: { es: { text: 'Nueva formulación', a: 'x', b: 'y', c: 'z' } },
    });
    const after = await getTestQuestions('official', 1);
    expect(after[0]).toMatchObject({ correct: 'c' });
    expect(after[0].i18n.es!.text).toBe('Nueva formulación');
    void u;
  });

  it('деактивированный вопрос пропадает из теста, но тест остаётся рабочим', async () => {
    const ids = await seedContent(db, { tests: 2 });
    const u = await makeUser();
    await db.query('update questions set is_active = false where id = $1', [ids[0][0]]);
    expect((await getTestQuestions('official', 1))).toHaveLength(29);
    expect((await listTests(u.id))[0].playable).toBe(29);
  });

  it('фильтры списка: нет перевода, не проверен, поиск, тест', async () => {
    await importQuestions(validateDoc(seed()).questions);
    const enOnly = validateDoc(seed()).questions.slice(0, 3).map((q, i) => ({ ...q, source_ref: 'x' + i, i18n: { es: q.i18n.es } }));
    await importQuestions(enOnly);
    expect((await listQuestions({ missing: 'ru' })).total).toBe(3);
    expect((await listQuestions({ machine: 'hy' })).total).toBe(30);
    expect((await listQuestions({ q: '135 cm' })).total).toBeGreaterThanOrEqual(1);
    expect((await listQuestions({ rights: 'unverified' })).total).toBe(0);
    expect((await listQuestions({ page: 2, perPage: 10 })).rows).toHaveLength(10);
  });

  it('замена вопроса в слоте теста; дубль в том же тесте запрещён', async () => {
    const ids = await seedContent(db, { tests: 2 });
    await setSlot('official', 1, 1, ids[1][0]);
    expect((await getTestSlots('official', 1))[0].question_id).toBe(ids[1][0]);
    await expect(setSlot('official', 1, 2, ids[1][0])).rejects.toBeInstanceOf(ValidationError);
    await expect(setSlot('official', 1, 2, '00000000-0000-0000-0000-000000000000')).rejects.toBeInstanceOf(ValidationError);
    const t = await listAllTests('official');
    expect(t[0]).toMatchObject({ number: 1, slots: 30, playable: 30 });
  });
});

describe('темы и массовые действия', () => {
  it('список тем, переименование, слияние, «без темы»', async () => {
    const { listTopics, renameTopic, bulkUpdate } = await import('../lib/repo/admin');
    await importQuestions(validateDoc(seed()).questions);
    const before = await listTopics();
    expect(before.reduce((s, t) => s + t.n, 0)).toBe(30);
    const seg = before.find((t) => t.topic === 'seguridad')!;
    const luces = before.find((t) => t.topic === 'luces')!;
    // слияние: luces → seguridad
    await renameTopic('luces', 'seguridad');
    const after = await listTopics();
    expect(after.find((t) => t.topic === 'seguridad')!.n).toBe(seg.n + luces.n);
    expect(after.find((t) => t.topic === 'luces')).toBeUndefined();
    await renameTopic('seguridad', '');
    expect((await listTopics()).find((t) => t.topic === null)!.n).toBe(seg.n + luces.n);

    // массово: тема + статус + активность у выбранных
    const ids = (await listQuestions({ perPage: 3 })).rows.map((r: any) => r.id);
    expect(await bulkUpdate(ids, { topic: 'новая', rights_status: 'licensed', is_active: false })).toEqual({ updated: 3 });
    const rows = (await listQuestions({ topic: 'новая' })).rows;
    expect(rows.every((r: any) => r.rights_status === 'licensed' && r.is_active === false)).toBe(true);
    // без ключа topic тема не трогается
    await bulkUpdate(ids, { is_active: true });
    expect((await listQuestions({ topic: 'новая' })).total).toBe(3);
    await expect(bulkUpdate(ids, { rights_status: 'bogus' })).rejects.toBeInstanceOf(ValidationError);
  });
});

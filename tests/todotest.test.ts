import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Db } from '../lib/db';
import { makeDb } from './helpers';
import { convertTodotest, fixMojibake } from '../lib/convert-todotest';
import { validateDoc, importQuestions, importTests } from '../lib/questions-io';
import { saveQuestion, ValidationError } from '../lib/repo/admin';
import { getTestQuestions } from '../lib/repo/content';
import { choicesOf } from '../lib/types';

let db: Db;
beforeEach(async () => { db = await makeDb(); });
afterEach(async () => { await db.close(); });

const moji = (s: string) => Buffer.from(s, 'utf8').toString('latin1');

const rawTest = {
  test_id: 4,
  questions: [
    // порядок в файле перепутан — конвертер обязан отсортировать по num
    { question_id: '120', num: 2, text: moji('¿Cómo entrar en una glorieta?'), options: [moji('Cediendo el paso.'), moji('Sin ceder.')], correct_letter: 'A', image_file: null },
    { question_id: '155855', num: 1, text: moji('¿Es aconsejable conducir con chanclas?'), options: ['No.', 'Sí.', 'Tal vez.'], correct_letter: 'B', image_file: 'images/2013.jpg' },
  ],
};

describe('конвертер выгрузки TodoTest (LordOkami)', () => {
  it('чинит двойную кодировку и не трогает нормальный текст', () => {
    expect(fixMojibake(moji('¿Qué señal? Ñandú'))).toBe('¿Qué señal? Ñandú');
    expect(fixMojibake('¿Qué señal?')).toBe('¿Qué señal?');
    expect(fixMojibake('Привет Ã')).toBe('Привет Ã'); // есть символы > U+00FF — не трогаем
  });

  it('вопросы получают unverified, порядок тестов — по num, два варианта → пустой C', () => {
    const { questions, tests, report } = convertTodotest([rawTest], { imageUrl: (f) => '/q-images/' + f.split('/').pop() });
    expect(report).toMatchObject({ tests: 1, slots: 2, questions: 2, twoOptions: 1, withImage: 1 });
    expect(tests).toEqual([{ number: 4, category: 'mixed', source: 'lordokami', refs: ['155855', '120'] }]);
    const q120 = questions.find((q) => q.source_ref === '120')!;
    expect(q120.i18n.es!.text).toBe('¿Cómo entrar en una glorieta?');
    expect(q120.i18n.es!.c).toBe('');
    expect(q120.correct).toBe('a');
    expect(q120.rights_status).toBe('unverified');
    expect(questions.find((q) => q.source_ref === '155855')!.image_url).toBe('/q-images/2013.jpg');
  });

  it('одинаковый question_id в разных тестах — один вопрос', () => {
    const { questions, tests } = convertTodotest([rawTest, { ...rawTest, test_id: 5 }]);
    expect(questions).toHaveLength(2);
    expect(tests.map((t) => t.refs.length)).toEqual([2, 2]);
  });
});

describe('вопросы с двумя вариантами', () => {
  it('проходят валидацию импорта; C=правильный при двух вариантах — ошибка', () => {
    const { questions, tests } = convertTodotest([rawTest]);
    const ok = validateDoc({ questions, tests });
    expect(ok.errors).toEqual([]);
    expect(ok.questions).toHaveLength(2);
    const bad = validateDoc({ questions: [{ ...questions[1], correct: 'c' }] });
    expect(bad.errors[0]).toMatch(/вариантов два/);
  });

  it('импорт → тест из базы содержит вопрос без варианта C, choicesOf даёт A и B', async () => {
    const { questions, tests } = convertTodotest([rawTest]);
    await importQuestions(questions.map((q) => ({ ...q, rights_status: 'own' as const })));
    await importTests(tests);
    const qs = await getTestQuestions('mixed', 4);
    expect(qs.map((q) => q.id)).toHaveLength(2);
    const two = qs.find((q) => q.i18n.es!.c === '')!;
    expect(choicesOf(two)).toEqual(['a', 'b']);
    expect(choicesOf(qs.find((q) => q !== two)!)).toEqual(['a', 'b', 'c']);
  });

  it('админка: сохраняет вопрос без C, ругается если правильный C', async () => {
    const base = { rights_status: 'own', is_active: true, i18n: { es: { text: 'Q', a: 'Sí', b: 'No', c: '' } } };
    const id = await saveQuestion({ ...base, correct: 'b' });
    expect(id).toBeTruthy();
    await expect(saveQuestion({ ...base, correct: 'c' })).rejects.toBeInstanceOf(ValidationError);
    // перевод без C тоже допустим, но текст и A/B обязательны
    await expect(saveQuestion({ ...base, id, correct: 'a', i18n: { es: base.i18n.es, ru: { text: 'В', a: 'Да', b: '', c: '' } } })).rejects.toBeInstanceOf(ValidationError);
    await saveQuestion({ ...base, id, correct: 'a', i18n: { es: base.i18n.es, ru: { text: 'В', a: 'Да', b: 'Нет', c: '' } } });
  });
});

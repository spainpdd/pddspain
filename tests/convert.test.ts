import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Db } from '../lib/db';
import { makeDb } from './helpers';
import { convert, findQuestionObjects, inferTests } from '../lib/convert-lordokami';
import { validateDoc, importQuestions, importTests, exportQuestions } from '../lib/questions-io';
import { getTestQuestions } from '../lib/repo/content';

// Синтетические примеры типичных форм (НЕ данные реальных баз): проверяем, что эвристика их понимает
const shapeA = { preguntas: [
  { id: 101, enunciado: '¿Pregunta uno?', respuestas: [{ contenido: 'A1', correcta: false }, { contenido: 'B1', correcta: true }, { contenido: 'C1', correcta: false }], urlImagen: 'img/1.png' },
  { id: 102, enunciado: '¿Pregunta dos?', respuestas: [{ contenido: 'A2', correcta: true }, { contenido: 'B2', correcta: false }, { contenido: 'C2', correcta: false }] },
] };
const shapeB = [
  { question: 'Q three?', options: ['x', 'y', 'z'], correct: 2, image: null, explanation: '<b>Because</b> z' },
  { question: 'Q four?', options: ['x4', 'y4', 'z4'], correct: 1 },
  { question: 'Q five?', options: ['x5', 'y5', 'z5'], correct: 0 },
];
const shapeC = { questions: [{ text: 'Q six?', a: 'a6', b: 'b6', c: 'c6', correct_answer: 'C' }, { text: 'Q four dup', options: ['a', 'b'], correct: 1 }] };

describe('конвертер сырых выгрузок', () => {
  it('понимает разные формы, определяет 0-based, чистит HTML, пропускает битые', () => {
    const raws = [...findQuestionObjects(shapeA, 'a.json'), ...findQuestionObjects(shapeB, 'b.json'), ...findQuestionObjects(shapeC, 'c.json')];
    expect(raws).toHaveLength(7);
    const { questions, report } = convert(raws);
    expect(report.indexBase).toBe(0); // в данных есть 0
    expect(report.converted).toBe(6);
    expect(report.skipped).toHaveLength(1);
    expect(report.skipped[0].reason).toContain('вариантов ответа 2');
    const by = Object.fromEntries(questions.map((q) => [q.i18n.es!.text, q]));
    expect(by['¿Pregunta uno?']).toMatchObject({ correct: 'b', source_ref: '101', rights_status: 'unverified', source: 'lordokami', image_url: 'img/1.png' });
    expect(by['¿Pregunta dos?'].correct).toBe('a');
    expect(by['Q three?'].correct).toBe('c');
    expect(by['Q three?'].i18n.es!.explanation).toBe('Because z');
    expect(by['Q six?'].correct).toBe('c');
    // результат проходит нашу валидацию
    expect(validateDoc({ questions }).errors).toEqual([]);
  });

  it('число как правильный ответ без нуля и без тройки — не гадает, просит указать base', () => {
    const raws = findQuestionObjects([{ question: 'q', options: ['a', 'b', 'c'], correct: 2 }], 'x.json');
    const r = convert(raws);
    expect(r.report.converted).toBe(0);
    expect(r.report.warnings[0]).toContain('--index-base');
    expect(convert(raws, { indexBase: 1 }).questions[0].correct).toBe('b');
  });

  it('дубликаты по тексту+вариантам склеиваются', () => {
    const raws = findQuestionObjects([
      { question: 'Same?', options: ['a', 'b', 'c'], correct: 'a' },
      { question: 'same?  ', options: ['A', 'B', 'C'], correct: 'a' },
    ], 'x.json');
    const r = convert(raws);
    expect(r.report.converted).toBe(1);
    expect(r.report.duplicates).toBe(1);
  });

  it('файл из 30 вопросов с номером в имени = тест; иначе тесты не выдумываются', () => {
    const refs = (file: string, n: number) => Array.from({ length: n }, (_, i) => ({ file, ref: `${file}-${i}` }));
    expect(inferTests([...refs('test_2.json', 30), ...refs('test_1.json', 30)]).map((t) => t.number)).toEqual([1, 2]);
    expect(inferTests([...refs('test_1.json', 30), ...refs('extra.json', 30)])).toEqual([]);
    expect(inferTests(refs('test_1.json', 29))).toEqual([]);
  });
});

describe('импорт тестов с сохранением состава', () => {
  let db: Db;
  beforeEach(async () => { db = await makeDb(); });
  afterEach(async () => { await db.close(); });

  it('состав тестов из файла воспроизводится; повторный импорт не затирает', async () => {
    const qs = Array.from({ length: 6 }, (_, i) => ({
      source: 'lordokami', source_ref: `r${i}`, rights_status: 'own' as const, correct: 'a' as const,
      i18n: { es: { text: `Q${i}`, a: 'a', b: 'b', c: 'c' } },
    }));
    await importQuestions(qs);
    const tests = [{ number: 2, source: 'lordokami', refs: ['r5', 'r4', 'r3'] }, { number: 1, source: 'lordokami', refs: ['r0', 'r1', 'r2', 'nope'] }];
    expect(await importTests(tests)).toEqual({ created: 2, skipped: 0, missingRefs: 1 });
    expect((await getTestQuestions('official', 2)).map((q) => q.i18n.es!.text)).toEqual(['Q5', 'Q4', 'Q3']);
    expect((await getTestQuestions('official', 1)).map((q) => q.i18n.es!.text)).toEqual(['Q0', 'Q1', 'Q2']);
    expect(await importTests(tests)).toMatchObject({ created: 0, skipped: 2 });
    const exp = await exportQuestions();
    expect(exp.tests.find((t) => t.number === 2)!.refs).toEqual(['r5', 'r4', 'r3']);
  });
});

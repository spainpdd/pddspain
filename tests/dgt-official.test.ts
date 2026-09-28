import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Db } from '../lib/db';
import { makeDb } from './helpers';
import { convertDgtOfficial, dgtTopic } from '../lib/convert-dgt-official';
import { validateDoc, importQuestions, importTests } from '../lib/questions-io';
import { getTestQuestions, listTests } from '../lib/repo/content';
import { makeUser } from './helpers';

let db: Db;
beforeEach(async () => { db = await makeDb(); });
afterEach(async () => { await db.close(); });

const opt = (t: string) => ({ name: 'x', text: t });
const bank = {
  aaa: {
    question_id: 'aaa', text: 'Pregunta uno', options: [opt('Sí'), opt('No'), opt('Quizá')],
    correct_index: 0, correct_option_text: 'Sí', image_url: 'https://sedeweb.dgt.gob.es/EXAM/WEB_AUTO9/IMAGENES/09_MANIOBRAS/X/1.jpg', image_file: 'imgs/aaa.jpg',
  },
  // индекс устарел: в банке порядок вариантов уже другой, верный ответ — по тексту
  bbb: {
    question_id: 'bbb', text: 'Pregunta dos', options: [opt('Moderar'), opt('Detener'), opt('Acelerar')],
    correct_index: 2, correct_option_text: 'Moderar', image_url: null, image_file: null,
  },
  // без ответа («lectura fácil») — пропускается
  ccc: { question_id: 'ccc', text: 'Pregunta tres', options: [opt('a'), opt('b'), opt('c')], correct_index: null, correct_option_text: null },
};
const exam = (texts: string[]) => ({ questions: texts.map((text, i) => ({ num: i + 1, text })) });

describe('официальный банк DGT', () => {
  it('правильный ответ берётся по тексту, устаревший индекс не ломает; вопрос без ответа пропускается', () => {
    const r = convertDgtOfficial(bank as any, []);
    expect(r.questions.map((q) => q.source_ref)).toEqual(['aaa', 'bbb']);
    expect(r.questions.find((q) => q.source_ref === 'bbb')!.correct).toBe('a');
    expect(r.report.reordered).toBe(1);
    expect(r.report.skipped).toHaveLength(1);
    expect(r.questions.every((q) => q.rights_status === 'dgt_official' && q.source === 'dgt-simulador')).toBe(true);
  });

  it('тема — из официального раздела DGT по пути картинки', () => {
    expect(dgtTopic('https://x/EXAM/WEB_AUTO9/IMAGENES/09_MANIOBRAS/INC/1.jpg')).toBe('maniobras');
    expect(dgtTopic('https://x/IMAGENES/22-RECURSOS/1.jpg')).toBe('recursos');
    expect(dgtTopic(null)).toBeNull();
  });

  it('одинаковые экзамены объединяются в один тест, номера с firstTest', () => {
    const e1 = exam(['Pregunta dos', 'Pregunta uno']);
    const e2 = exam(['Pregunta uno', 'Pregunta dos']);
    const r = convertDgtOfficial(bank as any, [e1, e1, e2], { firstTest: 5 });
    expect(r.report.forms).toBe(2);
    expect(r.tests).toEqual([
      { number: 5, category: 'official', source: 'dgt-simulador', refs: ['bbb', 'aaa'] },
      { number: 6, category: 'official', source: 'dgt-simulador', refs: ['aaa', 'bbb'] },
    ]);
  });

  it('импорт: тесты играбельны без флага unverified, вопросы помечены official', async () => {
    const e = exam(['Pregunta uno', 'Pregunta dos']);
    const r = convertDgtOfficial(bank as any, [e]);
    expect(validateDoc({ questions: r.questions, tests: r.tests }).errors).toEqual([]);
    await importQuestions(r.questions);
    await importTests(r.tests);
    const qs = await getTestQuestions('official', 1);
    expect(qs).toHaveLength(2);
    expect(qs.every((q) => q.official === true)).toBe(true);
    const u = await makeUser();
    expect((await listTests(u.id))[0]).toMatchObject({ number: 1, playable: 2, status: 'available' });
  });
});

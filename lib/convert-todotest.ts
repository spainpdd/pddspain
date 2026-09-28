/**
 * Точный конвертер выгрузки LordOkami/dgt-b-scrapper (папка data/todotest_b):
 *   tests/test_001.json … test_090.json  — по 30 вопросов, поля: question_id, num, text, options[],
 *   correct_letter, image_file ("images/2013.jpg"); question_bank.json — те же вопросы без повторов.
 * Особенности выгрузки, которые здесь исправляются:
 *   — текст сохранён с «двойной» кодировкой (UTF-8, прочитанный как Latin-1: «Â¿», «Ã­»);
 *   — часть вопросов (≈46) имеет только два варианта ответа;
 *   — пояснений в выгрузке нет (поле explanation остаётся пустым: их нужно написать самим).
 * Всё получает статус прав unverified.
 */
import type { ImportQuestion } from './questions-io';
import { guessTopic } from './topics';

export interface RawTodotestQuestion {
  question_id: string;
  num: number;
  text: string;
  options: string[];
  correct_letter?: string;
  correct_index?: number;
  image_file?: string | null;
  image_url?: string | null;
}
export interface RawTodotestTest {
  test_id: number;
  questions: RawTodotestQuestion[];
}

/** «Ã¿» → «¿». Чинит только если все символы ≤ U+00FF и результат — корректный UTF-8 */
export function fixMojibake(s: string): string {
  if (!/[ÂÃ]/.test(s)) return s;
  for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) > 0xff) return s;
  const fixed = Buffer.from(s, 'latin1').toString('utf8');
  return fixed.includes('�') ? s : fixed;
}

const clean = (s: string) => fixMojibake(String(s ?? '')).replace(/\s+/g, ' ').trim();

export interface TodotestReport {
  tests: number;
  slots: number;
  questions: number;
  twoOptions: number;
  withImage: number;
  skipped: string[];
}

export function convertTodotest(
  rawTests: RawTodotestTest[],
  opts: { imageUrl?: (file: string) => string; source?: string } = {},
) {
  const source = opts.source ?? 'lordokami';
  const imageUrl = opts.imageUrl ?? ((f) => '/' + f);
  const report: TodotestReport = { tests: 0, slots: 0, questions: 0, twoOptions: 0, withImage: 0, skipped: [] };
  const byId = new Map<string, ImportQuestion>();
  const tests: { number: number; category: 'mixed'; source: string; refs: string[] }[] = [];

  for (const t of [...rawTests].sort((a, b) => a.test_id - b.test_id)) {
    const refs: string[] = [];
    for (const q of [...t.questions].sort((a, b) => a.num - b.num)) {
      report.slots++;
      const id = String(q.question_id);
      if (!byId.has(id)) {
        const options = (q.options ?? []).map(clean);
        const idx = q.correct_letter ? 'ABC'.indexOf(q.correct_letter.toUpperCase()) : (q.correct_index ?? -1);
        if (options.length < 2 || options.length > 3 || options.some((o) => !o)) {
          report.skipped.push(`тест ${t.test_id}, вопрос ${q.num}: вариантов ${options.length}`);
          continue;
        }
        if (idx < 0 || idx >= options.length) {
          report.skipped.push(`тест ${t.test_id}, вопрос ${q.num}: непонятен правильный ответ`);
          continue;
        }
        const text = clean(q.text);
        const image = q.image_file ? imageUrl(q.image_file) : null;
        if (options.length === 2) report.twoOptions++;
        if (image) report.withImage++;
        byId.set(id, {
          source,
          source_ref: id,
          rights_status: 'unverified',
          topic: guessTopic(text, options, q.image_file ?? null),
          correct: 'abc'[idx] as 'a' | 'b' | 'c',
          image_url: image,
          is_active: true,
          i18n: { es: { text, a: options[0], b: options[1], c: options[2] ?? '', explanation: null, status: 'machine' } },
        });
      }
      refs.push(id);
    }
    tests.push({ number: t.test_id, category: 'mixed', source, refs });
    report.tests++;
  }
  report.questions = byId.size;
  return { questions: [...byId.values()], tests, report };
}

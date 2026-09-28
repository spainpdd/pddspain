/**
 * Конвертер официальных вопросов из публичного симулятора DGT (sedeweb.dgt.gob.es, permiso B),
 * выгруженных проектом LordOkami/dgt-b-scrapper (папка data/):
 *   question_bank_B.json        — банк из 90 уникальных вопросов с правильным ответом и картинкой;
 *   exam_B_<время>/exam.json    — отдельные экзамены (по 30 вопросов); симулятор выдаёт всего 3 разных экзамена.
 * Варианты ответа в симуляторе перемешиваются при каждом запуске, поэтому порядок берётся из банка,
 * а правильный ответ определяется по тексту correct_option_text (correct_index в банке местами устарел).
 * Тексты DGT сохраняются без изменений (условие повторного использования DGT); статус прав — dgt_official.
 * «Лёгкое чтение» (lf_si) не используется: в нём нет правильных ответов.
 */
import type { ImportQuestion } from './questions-io';

export const DGT_SOURCE = 'dgt-simulador';

export interface DgtBankQuestion {
  question_id: string;
  text: string;
  options: (string | { text: string })[];
  correct_index: number | null;
  correct_option_text?: string | null;
  image_url?: string | null;
  image_file?: string | null;
}
export interface DgtExam {
  questions: { num: number; text: string; options?: unknown[] }[];
}

const optText = (o: string | { text: string }) => (typeof o === 'string' ? o : o.text);
const norm = (s: string) => s.replace(/\s+/g, ' ').trim();

/** Официальные разделы DGT → короткие темы. Код берётся из пути картинки .../IMAGENES/04_CIRCULACION/... */
const TOPICS: Record<string, string> = {
  '01': 'accidentes-emergencias', '02': 'agentes', '03': 'centros-colaboradores', '04': 'circulacion',
  '05': 'conductor-factor-humano', '06': 'documentos', '07': 'factores-climatologicos', '08': 'luces',
  '09': 'maniobras', '10': 'medio-ambiente', '11': 'normas-generales', '12': 'seguridad-activa-pasiva',
  '13': 'senales-catalogo', '14': 'senales-circulacion', '15': 'servicios-prioritarios', '16': 'mantenimiento',
  '17': 'transporte', '18': 'otros-usuarios', '19': 'vehiculos-tipos', '20': 'vehiculos-partes',
  '21': 'grupos-riesgo', '22': 'recursos',
};
export function dgtTopic(imageUrl: string | null | undefined): string | null {
  const m = /IMAGENES\/(\d{2})[_-]/.exec(imageUrl ?? '');
  return (m && TOPICS[m[1]]) || null;
}

export interface DgtReport {
  questions: number;
  exams: number;
  forms: number;
  /** сколько вопросов с расхождением correct_index и текста правильного ответа (взят текст) */
  reordered: number;
  skipped: string[];
}

export function convertDgtOfficial(
  bank: Record<string, DgtBankQuestion>,
  exams: DgtExam[],
  opts: { imageUrl?: (q: DgtBankQuestion) => string | null; firstTest?: number } = {},
) {
  const report: DgtReport = { questions: 0, exams: exams.length, forms: 0, reordered: 0, skipped: [] };
  const byText = new Map<string, DgtBankQuestion>();
  for (const q of Object.values(bank)) byText.set(norm(q.text), q);

  const questions = new Map<string, ImportQuestion>();
  for (const q of Object.values(bank)) {
    const options = q.options.map((o) => norm(optText(o)));
    // В банке порядок вариантов мог обновиться после того, как записан correct_index, поэтому
    // главным считаем текст правильного ответа (correct_option_text), а индекс — запасной вариант.
    const ct = q.correct_option_text ? norm(q.correct_option_text) : null;
    const byTextIdx = ct ? options.reduce<number[]>((acc, o, i) => (o === ct ? [...acc, i] : acc), []) : [];
    const idx = byTextIdx.length === 1 ? byTextIdx[0] : ct ? -1 : q.correct_index;
    if (options.length !== 3 || idx === null || idx === undefined || idx < 0 || idx > 2) {
      report.skipped.push(`${q.question_id}: не удалось однозначно определить правильный ответ`);
      continue;
    }
    if (q.correct_index !== null && q.correct_index !== undefined && q.correct_index !== idx) report.reordered++;
    questions.set(q.question_id, {
      source: DGT_SOURCE,
      source_ref: q.question_id,
      rights_status: 'dgt_official',
      topic: dgtTopic(q.image_url),
      correct: 'abc'[idx] as 'a' | 'b' | 'c',
      image_url: opts.imageUrl ? opts.imageUrl(q) : (q.image_url ?? null),
      is_active: true,
      i18n: { es: { text: norm(q.text), a: options[0], b: options[1], c: options[2], explanation: null, status: 'reviewed' } },
    });
  }

  // разные экзамены → уникальные «формы» (набор вопросов в порядке num)
  const forms = new Map<string, string[]>();
  for (const e of exams) {
    const refs: string[] = [];
    for (const x of [...e.questions].sort((a, b) => a.num - b.num)) {
      const b = byText.get(norm(x.text));
      if (b && questions.has(b.question_id)) refs.push(b.question_id);
    }
    if (refs.length === e.questions.length && refs.length > 0) forms.set(refs.join(','), refs);
  }
  report.forms = forms.size;
  const first = opts.firstTest ?? 1;
  const tests = [...forms.values()].map((refs, i) => ({ number: first + i, category: 'official' as const, source: DGT_SOURCE, refs }));
  report.questions = questions.size;
  return { questions: [...questions.values()], tests, report };
}

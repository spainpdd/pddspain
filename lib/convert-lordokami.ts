/**
 * Конвертер «сырых» JSON-выгрузок (в т.ч. LordOkami/dgt-b-scrapper) в формат dgt-pwa/questions@1.
 *
 * Точная схема их файлов мне была недоступна, поэтому конвертер УГАДЫВАЕТ поля по типичным названиям
 * (enunciado/pregunta/question…, respuestas/answers/options…, correcta/correct…, urlImagen/image…)
 * и честно печатает отчёт: сколько вопросов распознано, что пропущено и почему.
 * Если ваши файлы устроены иначе — пришлите 2–3 записи, и список ключей ниже правится за минуту.
 *
 * Все вопросы получают rights_status = 'unverified' (пользователям не показываются, пока вы не смените статус).
 */
import crypto from 'node:crypto';
import type { ImportQuestion } from './questions-io';

const TEXT_KEYS = ['enunciado', 'pregunta', 'question', 'text', 'texto', 'statement', 'enunciat', 'title', 'titulo'];
const OPTIONS_KEYS = ['respuestas', 'answers', 'options', 'opciones', 'choices', 'respuesta', 'alternativas'];
const OPTION_TEXT_KEYS = ['contenido', 'texto', 'text', 'respuesta', 'answer', 'label', 'value', 'descripcion', 'title'];
const OPTION_FLAG_KEYS = ['correcta', 'correct', 'iscorrect', 'es_correcta', 'right', 'valid', 'acierto'];
const CORRECT_KEYS = ['correcta', 'correct', 'correctanswer', 'correct_answer', 'respuesta_correcta', 'respuestacorrecta', 'solucion', 'solution', 'answer_correct', 'correctindex'];
const IMAGE_KEYS = ['urlimagen', 'url_imagen', 'imagen', 'image', 'image_url', 'imageurl', 'img', 'foto', 'imagepath', 'image_path', 'local_image', 'localimage'];
const EXPLANATION_KEYS = ['explicacion', 'explanation', 'comentario', 'pista', 'justificacion', 'feedback'];
const ID_KEYS = ['id', 'idpregunta', 'id_pregunta', 'question_id', 'questionid', 'codigo', 'uid'];
const TOPIC_KEYS = ['tema', 'topic', 'categoria', 'category', 'materia'];
const OPTION_LETTER_KEYS = [['a', 'b', 'c'], ['opcion_a', 'opcion_b', 'opcion_c'], ['respuesta_a', 'respuesta_b', 'respuesta_c'], ['option_a', 'option_b', 'option_c'], ['1', '2', '3']];

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
const lc = (o: any) => Object.fromEntries(Object.keys(o).map((k) => [k.toLowerCase(), o[k]]));
const firstKey = (o: Record<string, any>, keys: string[]) => keys.find((k) => o[k] !== undefined && o[k] !== null && o[k] !== '');
const clean = (s: unknown) => String(s ?? '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

export interface RawQuestion {
  raw: any;
  file: string;
}

/** Рекурсивно ищет массивы объектов, похожих на вопросы */
export function findQuestionObjects(data: unknown, file: string, out: RawQuestion[] = [], depth = 0): RawQuestion[] {
  if (depth > 6 || data === null || typeof data !== 'object') return out;
  if (Array.isArray(data)) {
    for (const it of data) {
      if (it && typeof it === 'object' && !Array.isArray(it) && looksLikeQuestion(it)) out.push({ raw: it, file });
      else findQuestionObjects(it, file, out, depth + 1);
    }
    return out;
  }
  if (looksLikeQuestion(data)) {
    out.push({ raw: data, file });
    return out;
  }
  for (const v of Object.values(data as object)) findQuestionObjects(v, file, out, depth + 1);
  return out;
}

function looksLikeQuestion(o: any): boolean {
  const l = lc(o);
  return !!firstKey(l, TEXT_KEYS) && (!!firstKey(l, OPTIONS_KEYS) || OPTION_LETTER_KEYS.some((ks) => ks.every((k) => l[k] !== undefined)));
}

export interface ConvertOptions {
  source?: string;
  /** 0 или 1: как нумеруются варианты, если правильный ответ задан числом. По умолчанию определяется по данным */
  indexBase?: 0 | 1;
  imagePrefix?: string;
}

export interface ConvertReport {
  found: number;
  converted: number;
  duplicates: number;
  skipped: { reason: string; file: string; sample: string }[];
  indexBase: 0 | 1 | 'n/a';
  warnings: string[];
}

interface Parsed {
  text: string;
  options: string[];
  correctIdx: number | null;
  correctNum: number | null;
  image: string | null;
  explanation: string | null;
  ref: string | null;
  topic: string | null;
}

function parseOne(raw: any): Parsed | { error: string } {
  const l = lc(raw);
  const textKey = firstKey(l, TEXT_KEYS)!;
  const text = clean(l[textKey]);
  if (!text) return { error: 'пустой текст вопроса' };

  let options: string[] = [];
  let flagged = -1;

  const okey = firstKey(l, OPTIONS_KEYS);
  if (okey && Array.isArray(l[okey])) {
    (l[okey] as any[]).forEach((o, i) => {
      if (o && typeof o === 'object') {
        const ol = lc(o);
        const tk = firstKey(ol, OPTION_TEXT_KEYS);
        options.push(clean(tk ? ol[tk] : ''));
        const fk = OPTION_FLAG_KEYS.find((k) => ol[k] !== undefined);
        if (fk && (ol[fk] === true || ol[fk] === 1 || ol[fk] === '1' || ol[fk] === 'true' || ol[fk] === 'S' || ol[fk] === 'si')) flagged = i;
      } else options.push(clean(o));
    });
  } else {
    const set = OPTION_LETTER_KEYS.find((ks) => ks.every((k) => l[k] !== undefined));
    if (set) options = set.map((k) => clean(l[k]));
  }
  options = options.filter((o, i) => o || i < 3);
  if (options.length !== 3) return { error: `вариантов ответа ${options.length}, ожидалось 3` };
  if (options.some((o) => !o)) return { error: 'пустой вариант ответа' };

  let correctIdx: number | null = flagged >= 0 ? flagged : null;
  let correctNum: number | null = null;
  if (correctIdx === null) {
    const ck = CORRECT_KEYS.find((k) => l[k] !== undefined && !Array.isArray(l[k]) && typeof l[k] !== 'object');
    if (ck) {
      const v = l[ck];
      if (typeof v === 'string' && /^[abcABC]$/.test(v.trim())) correctIdx = 'abc'.indexOf(v.trim().toLowerCase());
      else if (v !== '' && Number.isFinite(Number(v))) correctNum = Number(v);
    }
  }

  const ik = firstKey(l, IMAGE_KEYS);
  const ek = firstKey(l, EXPLANATION_KEYS);
  const idk = firstKey(l, ID_KEYS);
  const tk = firstKey(l, TOPIC_KEYS);
  return {
    text,
    options,
    correctIdx,
    correctNum,
    image: ik && typeof l[ik] === 'string' ? String(l[ik]).trim() : null,
    explanation: ek ? clean(l[ek]) || null : null,
    ref: idk ? String(l[idk]) : null,
    topic: tk && typeof l[tk] !== 'object' ? clean(l[tk]) || null : null,
  };
}

export function convert(raws: RawQuestion[], opts: ConvertOptions = {}) {
  const source = opts.source ?? 'lordokami';
  const report: ConvertReport = { found: raws.length, converted: 0, duplicates: 0, skipped: [], indexBase: 'n/a', warnings: [] };
  const parsed: { p: Parsed; file: string }[] = [];
  for (const r of raws) {
    const p = parseOne(r.raw);
    if ('error' in p) report.skipped.push({ reason: p.error, file: r.file, sample: clean(JSON.stringify(r.raw)).slice(0, 120) });
    else parsed.push({ p, file: r.file });
  }

  // как нумеруются варианты, если правильный ответ — число
  const nums = parsed.map((x) => x.p.correctNum).filter((n): n is number => n !== null);
  let base: 0 | 1 | null = opts.indexBase ?? null;
  if (nums.length && base === null) {
    if (nums.includes(0)) base = 0;
    else if (nums.includes(3)) base = 1;
    else report.warnings.push('Правильный ответ задан числом, и по данным непонятно, нумерация с 0 или с 1. Запустите с --index-base 0 или --index-base 1.');
  }
  if (nums.length) report.indexBase = base ?? 'n/a';

  const seen = new Map<string, number>();
  const out: ImportQuestion[] = [];
  const refByFileKey: { file: string; ref: string }[] = [];

  for (const { p, file } of parsed) {
    let idx = p.correctIdx;
    if (idx === null && p.correctNum !== null && base !== null) idx = p.correctNum - base;
    if (idx === null || idx < 0 || idx > 2) {
      report.skipped.push({ reason: 'не удалось определить правильный ответ', file, sample: p.text.slice(0, 100) });
      continue;
    }
    const key = crypto.createHash('sha1').update(norm(p.text) + '|' + p.options.map(norm).join('|')).digest('hex').slice(0, 12);
    if (seen.has(key)) {
      report.duplicates++;
      refByFileKey.push({ file, ref: out[seen.get(key)!].source_ref! });
      continue;
    }
    const image = p.image ? (opts.imagePrefix && !/^https?:|^\//.test(p.image) ? opts.imagePrefix + p.image : p.image) : null;
    const ref = p.ref && !out.some((o) => o.source_ref === p.ref) ? p.ref : key;
    seen.set(key, out.length);
    out.push({
      source,
      source_ref: ref,
      rights_status: 'unverified',
      topic: p.topic,
      correct: 'abc'[idx] as 'a' | 'b' | 'c',
      image_url: image,
      is_active: true,
      i18n: { es: { text: p.text, a: p.options[0], b: p.options[1], c: p.options[2], explanation: p.explanation, status: 'machine' } },
    });
    refByFileKey.push({ file, ref });
    report.converted++;
  }
  return { questions: out, report, refByFileKey };
}

/**
 * Если каждый файл содержит ровно `size` вопросов и в имени есть номер — считаем файл тестом.
 * Возвращает тесты в порядке номеров; если условие не выполнено — пустой список.
 */
export function inferTests(refByFileKey: { file: string; ref: string }[], size = 30) {
  const byFile = new Map<string, string[]>();
  for (const r of refByFileKey) byFile.set(r.file, [...(byFile.get(r.file) ?? []), r.ref]);
  const tests: { number: number; category: 'mixed'; refs: string[] }[] = [];
  for (const [file, refs] of byFile) {
    const m = /(\d{1,3})(?!.*\d)/.exec(file.replace(/\.json$/i, '').split('/').pop() ?? '');
    if (refs.length !== size || !m) return [];
    tests.push({ number: Number(m[1]), category: 'mixed', refs });
  }
  const nums = tests.map((t) => t.number);
  if (new Set(nums).size !== nums.length) return [];
  return tests.sort((a, b) => a.number - b.number);
}

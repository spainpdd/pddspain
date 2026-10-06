/**
 * Prodamus (payform): подпись и проверка уведомлений. Чистые функции — без БД и сети.
 *
 * Канонический алгоритм подписи (JSON-схема; она же — заголовок `Sign` вебхука и поле `signature` у do=pay):
 *   1. все значения приводятся к строкам (число → "1000", null → "", true → "1", false → "");
 *   2. ключи сортируются рекурсивно;
 *   3. JSON без пробелов, кириллица как есть (не \uXXXX), слэш экранируется как «\/» (так делает PHP json_encode);
 *   4. HMAC-SHA256 от этой строки секретным ключом, результат — hex.
 * Из данных перед проверкой убираются поля подписи (`signature`, `sign`, `_payform_sign`).
 */
import crypto from 'node:crypto';

export type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

const SIGN_FIELDS = ['signature', 'sign', '_payform_sign'];

function stringifyDeep(v: unknown): Json {
  if (Array.isArray(v)) return v.map(stringifyDeep);
  if (v !== null && typeof v === 'object') {
    const o: { [k: string]: Json } = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) o[k] = stringifyDeep(x);
    return o;
  }
  if (v === null || v === undefined) return '';
  if (typeof v === 'boolean') return v ? '1' : '';
  return String(v);
}

const isNum = (s: string) => /^-?\d+$/.test(s);
/** Как PHP ksort(SORT_REGULAR): числовые ключи сравниваются как числа, остальные — как строки */
const cmpKeys = (a: string, b: string) => (isNum(a) && isNum(b) ? Number(a) - Number(b) : a < b ? -1 : a > b ? 1 : 0);

function ksortDeep(v: Json): Json {
  if (Array.isArray(v)) return v.map(ksortDeep);
  if (v !== null && typeof v === 'object') {
    const o: { [k: string]: Json } = {};
    for (const k of Object.keys(v).sort(cmpKeys)) o[k] = ksortDeep((v as { [k: string]: Json })[k]);
    return o;
  }
  return v;
}

/** Каноническая JSON-строка, от которой берётся HMAC */
export function canonicalJson(data: Record<string, unknown>): string {
  return JSON.stringify(ksortDeep(stringifyDeep(data))).replace(/\//g, '\\/');
}

export function signPayload(data: Record<string, unknown>, secret: string): string {
  return crypto.createHmac('sha256', secret).update(canonicalJson(data), 'utf8').digest('hex');
}

/** Проверка подписи. Секретов может быть несколько (ключ домена и сервисный ключ) — подходит любой непустой. */
export function verifyPayload(data: Record<string, unknown>, sign: string, secrets: string[]): boolean {
  const given = String(sign ?? '').trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(given)) return false;
  const clean: Record<string, unknown> = { ...data };
  for (const f of SIGN_FIELDS) delete clean[f];
  for (const secret of secrets.filter(Boolean)) {
    const expected = signPayload(clean, secret);
    if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(given))) return true;
  }
  return false;
}

const BAD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/** Объекты с ключами 0,1,2… подряд → массивы (как это делает PHP при json_encode) */
function listify(v: unknown): unknown {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) return v;
  const o = v as Record<string, unknown>;
  const keys = Object.keys(o);
  const out: Record<string, unknown> = {};
  for (const k of keys) out[k] = listify(o[k]);
  if (keys.length > 0 && keys.every((k, i) => k === String(i))) return keys.map((k) => out[k]);
  return out;
}

/** Разбор пар «ключ[вложенный][ключ]» → вложенный объект (как $_POST в PHP) */
export function nestPairs(pairs: Iterable<[string, string]>): Record<string, unknown> {
  const root: Record<string, unknown> = Object.create(null);
  for (const [rawKey, value] of pairs) {
    const m = /^([^[\]]+)((?:\[[^[\]]*\])*)$/.exec(rawKey);
    if (!m) continue;
    const path = [m[1], ...Array.from(m[2].matchAll(/\[([^[\]]*)\]/g), (x) => x[1])];
    if (path.some((p) => BAD_KEYS.has(p))) continue;
    let cur: Record<string, unknown> = root;
    for (let i = 0; i < path.length - 1; i++) {
      const k = path[i];
      if (typeof cur[k] !== 'object' || cur[k] === null) cur[k] = Object.create(null);
      cur = cur[k] as Record<string, unknown>;
    }
    const last = path[path.length - 1];
    if (last === '') {
      // products[] = x — добавление в список
      const n = Object.keys(cur).filter((k) => isNum(k)).length;
      cur[String(n)] = value;
    } else cur[last] = value;
  }
  return listify(root) as Record<string, unknown>;
}

/** Рубли «4900.00» → копейки; мусор → null */
export function parseSumKopecks(s: unknown): number | null {
  const t = String(s ?? '').trim().replace(',', '.');
  if (!/^\d{1,9}(\.\d{1,6})?$/.test(t)) return null;
  return Math.round(Number(t) * 100);
}

export function formatRub(kopecks: number): string {
  if (!Number.isInteger(kopecks) || kopecks <= 0) throw new Error('Сумма должна быть положительным целым числом копеек');
  return `${Math.trunc(kopecks / 100)}.${String(kopecks % 100).padStart(2, '0')}`;
}

/** Допустимые адреса формы оплаты: *.payform.ru, *.prodamus.ru, *.prodamus.tech, *.prodamuspay.ru */
const HOST_RE = /^([a-z0-9-]+\.)*[a-z0-9-]*(payform\.ru|prodamus\.ru|prodamus\.tech|prodamuspay\.ru)$/i;

/** «https://shop.payform.ru/», «shop.payform.ru» → «https://shop.payform.ru»; недопустимое → null */
export function normalizeFormUrl(raw: string): string | null {
  const t = (raw || '').trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  if (!t || /[/@:?#\s]/.test(t) || !HOST_RE.test(t)) return null;
  return `https://${t.toLowerCase()}`;
}

function flatten(prefix: string, v: unknown, out: [string, string][]) {
  if (Array.isArray(v)) v.forEach((x, i) => flatten(`${prefix}[${i}]`, x, out));
  else if (v !== null && typeof v === 'object') for (const [k, x] of Object.entries(v)) flatten(`${prefix}[${k}]`, x, out);
  else out.push([prefix, v === null || v === undefined ? '' : String(v)]);
}

/** Ссылка на оплату (do=pay): параметры в query; при наличии secret добавляется `signature` */
export function buildPayUrl(formUrl: string, params: Record<string, unknown>, secret?: string): string {
  const data = { ...params };
  const signature = secret ? signPayload(data, secret) : null;
  const pairs: [string, string][] = [];
  for (const [k, v] of Object.entries(data)) flatten(k, v, pairs);
  if (signature) pairs.push(['signature', signature]);
  return `${formUrl}/?${pairs.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')}`;
}

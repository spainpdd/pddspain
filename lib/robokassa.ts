/**
 * Robokassa: подпись платежа и проверка уведомлений. Чистые функции, без обращения к БД и сети.
 * Документация: https://docs.robokassa.ru/ru/pay-interface , /ru/notifications-and-redirects
 *
 *  • запрос оплаты:   MerchantLogin:OutSum:InvId[:Receipt]:Пароль#1[:Shp_a=1:Shp_b=2]
 *  • ResultURL:       OutSum:InvId:Пароль#2[:Shp_…]       (серверное уведомление)
 *  • SuccessURL:      OutSum:InvId:Пароль#1[:Shp_…]       (возврат покупателя)
 *  Shp_* — по алфавиту. Алгоритм хеша задаётся в кабинете магазина и должен совпадать (по умолчанию MD5).
 */
import crypto from 'node:crypto';

export type HashAlgo = 'md5' | 'sha1' | 'sha256' | 'sha384' | 'sha512';
export const PAY_URL = 'https://auth.robokassa.ru/Merchant/Index.aspx';

export function normalizeAlgo(x: unknown): HashAlgo {
  const v = String(x ?? '').trim().toLowerCase().replace('-', '');
  return v === 'sha1' || v === 'sha256' || v === 'sha384' || v === 'sha512' ? v : 'md5';
}

export function hashHex(s: string, algo: HashAlgo): string {
  return crypto.createHash(algo).update(s, 'utf8').digest('hex');
}

/** Копейки → «123.45» (формат OutSum) */
export function formatOutSum(kopecks: number): string {
  if (!Number.isInteger(kopecks) || kopecks <= 0) throw new Error('OutSum должен быть положительным целым числом копеек');
  return `${Math.trunc(kopecks / 100)}.${String(kopecks % 100).padStart(2, '0')}`;
}

/**
 * «49», «49.0», «49.00», «49.000000» → копейки. Всё, что не равно целому числу копеек
 * (например «49.005»), и мусор → null.
 */
export function parseOutSum(s: string | null | undefined): number | null {
  const m = /^(\d{1,12})(?:\.(\d{1,6}))?$/.exec((s ?? '').trim());
  if (!m) return null;
  const frac = (m[2] ?? '').padEnd(6, '0');
  if (/[1-9]/.test(frac.slice(2))) return null;
  return Number(m[1]) * 100 + Number(frac.slice(0, 2));
}

export type Shp = Record<string, string>;

function shpTail(shp?: Shp): string {
  const keys = Object.keys(shp ?? {}).sort();
  return keys.map((k) => `:${k}=${(shp as Shp)[k]}`).join('');
}

/** Строка, от которой считается подпись запроса оплаты */
export function paymentSignatureBase(p: { login: string; outSum: string; invId: string | number; password: string; receipt?: string; shp?: Shp }): string {
  return `${p.login}:${p.outSum}:${p.invId}${p.receipt ? `:${p.receipt}` : ''}:${p.password}${shpTail(p.shp)}`;
}

export function signPayment(p: Parameters<typeof paymentSignatureBase>[0], algo: HashAlgo): string {
  return hashHex(paymentSignatureBase(p), algo);
}

export interface PaymentLinkInput {
  login: string;
  password1: string;
  algo: HashAlgo;
  kopecks: number;
  invId: string | number;
  description: string;
  email?: string;
  culture?: 'ru' | 'en';
  isTest?: boolean;
  /** JSON чека (если нужен) — уже в виде строки; в подписи участвует в URL-закодированном виде */
  receipt?: string;
  shp?: Shp;
}

/** Описание: до 100 символов, без спецсимволов */
export function cleanDescription(s: string): string {
  return s.replace(/[^\p{L}\p{N} .,\-—–()]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 100);
}

export function buildPaymentUrl(i: PaymentLinkInput): string {
  const outSum = formatOutSum(i.kopecks);
  const receiptEnc = i.receipt ? encodeURIComponent(i.receipt) : undefined;
  const sig = signPayment({ login: i.login, outSum, invId: i.invId, password: i.password1, receipt: receiptEnc, shp: i.shp }, i.algo);
  const q = new URLSearchParams();
  q.set('MerchantLogin', i.login);
  q.set('OutSum', outSum);
  q.set('InvId', String(i.invId));
  q.set('Description', cleanDescription(i.description));
  q.set('SignatureValue', sig);
  if (receiptEnc) q.set('Receipt', receiptEnc);
  if (i.email) q.set('Email', i.email);
  q.set('Culture', i.culture ?? 'ru');
  if (i.isTest) q.set('IsTest', '1');
  for (const [k, v] of Object.entries(i.shp ?? {})) q.set(k, v);
  return `${PAY_URL}?${q.toString()}`;
}

function safeEqualHex(a: string, b: string): boolean {
  const x = Buffer.from(a.trim().toLowerCase(), 'utf8');
  const y = Buffer.from(b.trim().toLowerCase(), 'utf8');
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export interface NotifyParams {
  outSum: string;
  invId: string;
  signature: string;
  shp?: Shp;
}

function verify(n: NotifyParams, password: string, algo: HashAlgo): boolean {
  if (!n.outSum || !n.invId || !n.signature) return false;
  const base = `${n.outSum}:${n.invId}:${password}${shpTail(n.shp)}`;
  return safeEqualHex(hashHex(base, algo), n.signature);
}

/** ResultURL: подпись считается паролем #2 */
export const verifyResultSignature = (n: NotifyParams, password2: string, algo: HashAlgo) => verify(n, password2, algo);
/** SuccessURL: подпись считается паролем #1 */
export const verifySuccessSignature = (n: NotifyParams, password1: string, algo: HashAlgo) => verify(n, password1, algo);

/** Ответ, которого ждёт Robokassa после успешной обработки ResultURL */
export const resultAck = (invId: string | number) => `OK${invId}`;

/** Достаёт Shp_* из параметров запроса */
export function pickShp(params: URLSearchParams | Record<string, string>): Shp {
  const entries = params instanceof URLSearchParams ? [...params.entries()] : Object.entries(params);
  const out: Shp = {};
  for (const [k, v] of entries) if (/^shp_/i.test(k)) out[k] = v;
  return out;
}

/** Тонкая обёртка над Bot API + сборка сообщений бота */
import { env } from './env';
import type { Content, Lang, PlayerQuestion } from './types';

export type TgCall = (method: string, payload: Record<string, unknown>) => Promise<any>;

export class TelegramError extends Error {
  constructor(public code: number, message: string) {
    super(message);
  }
  get blocked() {
    return this.code === 403;
  }
}

/**
 * Страховка от «\uD83D\uDCDA» вместо эмодзи: если в тексте (из кода, базы или импортированных данных) оказались
 * буквальные последовательности \uXXXX / \u{XXXXX}, превращаем их в настоящие символы перед отправкой.
 */
export function decodeEscapes(s: string): string {
  return s
    .replace(/\\u\{([0-9a-fA-F]{1,6})\}/g, (m, h) => {
      const cp = parseInt(h, 16);
      return cp <= 0x10ffff ? String.fromCodePoint(cp) : m;
    })
    .replace(/\\u([0-9a-fA-F]{4})/g, (_m, h) => String.fromCharCode(parseInt(h, 16)));
}

export const callTelegram: TgCall = async (method, payload) => {
  const token = env.botToken;
  if (!token) throw new TelegramError(0, 'TELEGRAM_BOT_TOKEN не задан');
  for (const k of ['text', 'caption'] as const) {
    if (typeof payload[k] === 'string') payload = { ...payload, [k]: decodeEscapes(payload[k] as string) };
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json: any = await res.json().catch(() => ({}));
  if (!json.ok) throw new TelegramError(json.error_code ?? res.status, json.description ?? 'Telegram error');
  return json.result;
};

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const FLAG: Record<string, string> = { es: '🇪🇸 Español', ru: '🇷🇺 Русский', hy: '🇦🇲 Հայերեն' };

/** Один языковой блок: подпись языка, вопрос жирным, варианты ответа с жирными буквами */
function block(lang: string, c: Content) {
  const opts = [`<b>A)</b> ${esc(c.a)}`, `<b>B)</b> ${esc(c.b)}`];
  if (c.c) opts.push(`<b>C)</b> ${esc(c.c)}`);
  return `${FLAG[lang] ?? lang.toUpperCase()}\n<b>${esc(c.text)}</b>\n${opts.join('\n')}`;
}

/** Текст «вопроса дня»: испанский оригинал + перевод на язык пользователя (если есть) */
export function questionText(q: PlayerQuestion, trans: Lang, title = '🚦 Вопрос дня'): string {
  const es = q.i18n.es;
  if (!es) return `${title}\n\n(нет текста)`;
  const parts = [`<b>${title}</b>`, block('es', es)];
  const tr = q.i18n[trans];
  if (tr) parts.push(block(trans, tr));
  parts.push('<i>Выберите ответ кнопкой ниже 👇</i>');
  return parts.join('\n\n');
}

export function answerKeyboard(questionId: string, choices: readonly ('a' | 'b' | 'c')[] = ['a', 'b', 'c']) {
  return {
    inline_keyboard: [
      choices.map((c) => ({ text: c.toUpperCase(), callback_data: `d:${questionId}:${c}` })),
    ],
  };
}

/** Кнопка «Открыть приложение» — только если сайт на https (иначе Telegram отклонит) */
export function openAppKeyboard(path = '/dashboard', label = 'Открыть приложение') {
  if (!env.siteUrl.startsWith('https://')) return undefined;
  return { inline_keyboard: [[{ text: label, url: env.siteUrl + path }]] };
}

export function explanationFor(q: PlayerQuestion, trans: Lang): string | null {
  return q.i18n[trans]?.explanation || q.i18n.es?.explanation || null;
}

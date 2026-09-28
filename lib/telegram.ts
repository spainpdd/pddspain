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

export const callTelegram: TgCall = async (method, payload) => {
  const token = env.botToken;
  if (!token) throw new TelegramError(0, 'TELEGRAM_BOT_TOKEN не задан');
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

function block(label: string, c: Content) {
  return `<b>${label}</b> ${esc(c.text)}\nA) ${esc(c.a)}\nB) ${esc(c.b)}${c.c ? `\nC) ${esc(c.c)}` : ''}`;
}

/** Текст «вопроса дня»: испанский оригинал + перевод на язык пользователя (если есть) */
export function questionText(q: PlayerQuestion, trans: Lang, title = '🚦 Вопрос дня'): string {
  const es = q.i18n.es;
  if (!es) return `${title}\n\n(нет текста)`;
  const parts = [`<b>${title}</b>`, block('ES', es)];
  const tr = q.i18n[trans];
  if (tr) parts.push(block(trans.toUpperCase(), tr));
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
export function openAppKeyboard(path = '/dashboard') {
  if (!env.siteUrl.startsWith('https://')) return undefined;
  return { inline_keyboard: [[{ text: 'Открыть приложение', url: env.siteUrl + path }]] };
}

export function explanationFor(q: PlayerQuestion, trans: Lang): string | null {
  return q.i18n[trans]?.explanation || q.i18n.es?.explanation || null;
}

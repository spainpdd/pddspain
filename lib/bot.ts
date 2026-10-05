/**
 * Логика бота: команды, ответы на «вопрос дня», ежедневная рассылка.
 * Отправка сообщений внедряется через `tg`, чтобы тестировать без сети.
 */
import { env } from './env';
import { madridDateKey } from './engine';
import {
  answerKeyboard, callTelegram, explanationFor, esc, openAppKeyboard, questionText, TelegramError, type TgCall,
} from './telegram';
import { getQuestionOfDay, getQuestionsByIds } from './repo/content';
import { submitDaily, RuleError } from './repo/progress';
import { getProfileByTelegramId, getStats, listNotifiable, setNotify, upsertTelegramUser } from './repo/users';
import { confirmLoginTicket } from './repo/login-tickets';
import { choicesOf, type Choice, type Profile } from './types';
import { isChoice } from './engine';

const HELP =
  'Команды:\n/question — вопрос дня\n/stats — твои результаты\n/stop — отключить рассылку\n/start — включить рассылку';

/** Первое сообщение после /start: коротко, что внутри, и кнопка открытия приложения */
export function welcomeText(firstName: string): string {
  return [
    `Привет, ${esc(firstName)}! 👋`,
    '<b>DGT Права</b> — подготовка к теории DGT на русском.',
    [
      '✅ Разбор к каждому вопросу и перевод на русский или армянский',
      '🎯 Закрепление после каждых 10 тестов, чтобы пройденное не забывалось',
      '🔁 Ошибки возвращаются на повторение, пока вы их не исправите',
      '🚦 Каждый день здесь же — «вопрос дня»',
    ].join('\n'),
    'Нажмите кнопку ниже — откроется приложение с тестами.',
    HELP,
  ].join('\n\n');
}

async function sendQuestionOfDay(tg: TgCall, chatId: number, profile: Profile, prefix = '') {
  const q = await getQuestionOfDay(madridDateKey());
  if (!q) {
    await tg('sendMessage', { chat_id: chatId, text: 'Пока нет вопросов дня — загляни позже.' });
    return false;
  }
  await tg('sendMessage', {
    chat_id: chatId,
    parse_mode: 'HTML',
    text: prefix + questionText(q, profile.trans_lang),
    reply_markup: answerKeyboard(q.id, choicesOf(q)),
  });
  return true;
}

export async function statsText(profile: Profile): Promise<string> {
  const s = await getStats(profile.id);
  const lines = [`📊 <b>Твои результаты</b>`];
  lines.push(
    s.today_answers
      ? `Сегодня: ${s.today_answers} ответов, верно ${s.today_correct} (${Math.round((s.today_correct / s.today_answers) * 100)}%)`
      : 'Сегодня ты ещё не решал(а) вопросы.',
  );
  lines.push(`Всего ответов: ${s.total_answers}, точность ${s.accuracy}%`);
  if (s.errors_open) lines.push(`В разделе «Ошибки»: ${s.errors_open}`);
  return lines.join('\n');
}

export async function handleUpdate(update: any, tg: TgCall = callTelegram): Promise<void> {
  if (update?.callback_query) return handleCallback(update.callback_query, tg);
  const m = update?.message;
  if (!m?.text || !m.from || m.chat?.type !== 'private') return;

  const chatId: number = m.chat.id;
  const text = String(m.text).trim();
  const cmd = text.split(/[\s@]/)[0].toLowerCase();

  if (cmd === '/start' || cmd === '/resume') {
    // контакт сохраняется сразу: человек мог ещё не входить на сайт
    const profile = await upsertTelegramUser({
      id: m.from.id, first_name: m.from.first_name, last_name: m.from.last_name, username: m.from.username,
    });
    await setNotify(profile.id, true);

    // Вход через бота напрямую (кнопка «Войти через Telegram» на сайте): /start login_<token>
    const payload = text.slice(cmd.length).trim();
    if (payload.startsWith('login_')) {
      const ticketToken = payload.slice('login_'.length);
      const confirmed = await confirmLoginTicket(ticketToken, m.from.id);
      if (confirmed) {
        await tg('sendMessage', {
          chat_id: chatId,
          parse_mode: 'HTML',
          text: `✅ Вход подтверждён, ${esc(m.from.first_name || '')}! Вернитесь на сайт — вы уже авторизованы. Или нажмите кнопку ниже, чтобы открыть приложение здесь.\n\n${HELP}`,
          // ссылка входит в аккаунт в том браузере, где её откроют (встроенный браузер Telegram, браузер на ПК)
          reply_markup: openAppKeyboard(`/api/auth/telegram/ticket/${ticketToken}/enter`),
        });
        return;
      }
      // тикет не найден/истёк/уже использован — не молчим, просто идём дальше обычным приветствием
    }

    await tg('sendMessage', {
      chat_id: chatId,
      parse_mode: 'HTML',
      text: welcomeText(m.from.first_name || ''),
      reply_markup: openAppKeyboard('/dashboard'),
    });
    return;
  }

  const profile = await getProfileByTelegramId(m.from.id);
  if (!profile) {
    await tg('sendMessage', { chat_id: chatId, text: 'Нажми /start, чтобы начать.' });
    return;
  }

  switch (cmd) {
    case '/question':
      await sendQuestionOfDay(tg, chatId, profile);
      break;
    case '/stats':
      await tg('sendMessage', { chat_id: chatId, parse_mode: 'HTML', text: await statsText(profile), reply_markup: openAppKeyboard('/dashboard') });
      break;
    case '/stop':
      await setNotify(profile.id, false);
      await tg('sendMessage', { chat_id: chatId, text: 'Рассылка отключена. Включить снова: /start' });
      break;
    default:
      await tg('sendMessage', { chat_id: chatId, text: HELP });
  }
}

async function handleCallback(cb: any, tg: TgCall) {
  const data = String(cb.data ?? '');
  const match = /^d:([0-9a-f-]{36}):([abc])$/i.exec(data);
  const chatId = cb.message?.chat?.id;
  if (!match || !chatId) {
    await tg('answerCallbackQuery', { callback_query_id: cb.id }).catch(() => {});
    return;
  }
  const profile = await getProfileByTelegramId(cb.from.id);
  if (!profile) {
    await tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'Сначала нажми /start' });
    return;
  }
  const choice = match[2].toLowerCase();
  if (!isChoice(choice)) return;

  try {
    const r = await submitDaily(profile.id, match[1], choice as Choice);
    await tg('answerCallbackQuery', { callback_query_id: cb.id, text: r.correct ? 'Верно! ✅' : 'Неверно ❌' });
    // убираем кнопки, чтобы не отвечали дважды
    await tg('editMessageReplyMarkup', {
      chat_id: chatId, message_id: cb.message.message_id, reply_markup: { inline_keyboard: [] },
    }).catch(() => {});
    const exp = explanationFor(r.question, profile.trans_lang);
    const head = r.correct
      ? '✅ <b>Верно!</b>'
      : `❌ <b>Неверно.</b> Правильный ответ: <b>${r.question.correct.toUpperCase()}</b>\nВопрос сохранён в раздел «Ошибки».`;
    await tg('sendMessage', {
      chat_id: chatId,
      parse_mode: 'HTML',
      text: exp ? `${head}\n\n💡 ${esc(exp)}` : head,
      reply_markup: openAppKeyboard('/errors'),
    });
  } catch (e) {
    if (e instanceof RuleError) {
      await tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'Этот вопрос уже недоступен' }).catch(() => {});
      return;
    }
    throw e;
  }
}

/** Ежедневная рассылка. Возвращает счётчики. */
export async function sendDailyBroadcast(tg: TgCall = callTelegram, delayMs = 40) {
  const users = await listNotifiable();
  const res = { total: users.length, sent: 0, blocked: 0, failed: 0, skipped: 0 };
  const q = await getQuestionOfDay(madridDateKey());
  if (!q) return { ...res, skipped: users.length };

  for (const u of users) {
    try {
      const s = await getStats(u.id);
      const recap = s.total_answers
        ? `Вчера и раньше ты уже решил(а) ${s.total_answers} вопросов, точность ${s.accuracy}%.${s.errors_open ? ` В «Ошибках» ждут ${s.errors_open}.` : ''}\n\n`
        : '';
      await tg('sendMessage', {
        chat_id: u.telegram_id,
        parse_mode: 'HTML',
        text: recap + questionText(q, u.trans_lang),
        reply_markup: answerKeyboard(q.id, choicesOf(q)),
      });
      res.sent++;
    } catch (e) {
      if (e instanceof TelegramError && e.blocked) {
        await setNotify(u.id, false); // пользователь заблокировал бота — больше не пишем
        res.blocked++;
      } else res.failed++;
    }
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
  }
  return res;
}

/** Уведомление о покупке (если у пользователя есть чат с ботом — иначе тихо игнорируем) */
export async function notifyPaid(telegramId: number, until: string, tg: TgCall = callTelegram) {
  if (!env.botToken) return;
  await tg('sendMessage', {
    chat_id: telegramId,
    parse_mode: 'HTML',
    text: `✅ Оплата получена. Доступ открыт до <b>${new Date(until).toLocaleDateString('ru-RU')}</b>. Удачи на экзамене!`,
    reply_markup: openAppKeyboard('/test'),
  }).catch(() => {});
}

/** Уведомление о подарочном доступе от администратора */
export async function notifyGift(telegramId: number, until: string, tg: TgCall = callTelegram): Promise<boolean> {
  if (!env.botToken) return false;
  try {
    await tg('sendMessage', {
      chat_id: telegramId,
      parse_mode: 'HTML',
      text: `🎁 Вам открыт доступ ко всем тестам до <b>${new Date(until).toLocaleDateString('ru-RU')}</b>. Удачи на экзамене!`,
      reply_markup: openAppKeyboard('/test'),
    });
    return true;
  } catch {
    return false;
  }
}

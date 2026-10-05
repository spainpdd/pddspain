import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Db } from '../lib/db';
import { makeDb, seedContent, makeUser } from './helpers';
import { handleUpdate, sendDailyBroadcast } from '../lib/bot';
import { getStats, getProfileByTelegramId } from '../lib/repo/users';
import { TelegramError } from '../lib/telegram';
import { getQuestionOfDay } from '../lib/repo/content';
import { madridDateKey } from '../lib/engine';
import { createLoginTicket, getLoginTicket } from '../lib/repo/login-tickets';

let db: Db;
const calls: { method: string; payload: any }[] = [];
const tg = vi.fn(async (method: string, payload: any) => {
  calls.push({ method, payload });
  return {};
});

beforeEach(async () => {
  db = await makeDb();
  await seedContent(db, { tests: 1 });
  await db.query(`insert into question_translations (question_id, lang, text, option_a, option_b, option_c, explanation)
    select id, 'ru', 'Вопрос RU', 'А', 'Б', 'В', 'Пояснение RU' from questions`);
  calls.length = 0;
  tg.mockClear();
});
afterEach(async () => {
  await db.close();
});

const msg = (from: number, text: string) => ({ message: { text, from: { id: from, first_name: 'Гар' }, chat: { id: from, type: 'private' } } });

describe('бот', () => {
  it('/start сохраняет контакт в базе и приветствует', async () => {
    await handleUpdate(msg(5551, '/start'), tg);
    const p = await getProfileByTelegramId(5551);
    expect(p).not.toBeNull();
    expect(p!.notify).toBe(true);
    expect(calls[0].method).toBe('sendMessage');
    expect(calls[0].payload.text).toContain('вопрос дня');
  });

  it('/start login_<token> подтверждает вход через бота (кнопка на сайте) и отдельно приветствует', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.test';
    const token = await createLoginTicket();
    await handleUpdate(msg(5559, `/start login_${token}`), tg);
    expect(await getLoginTicket(token)).toMatchObject({ status: 'confirmed', telegram_id: 5559 });
    expect(calls[0].payload.text).toContain('Вход подтверждён');
    // кнопка «Открыть приложение» входит в аккаунт в любом браузере, где её откроют
    const url = calls[0].payload.reply_markup?.inline_keyboard?.[0]?.[0]?.url as string | undefined;
    expect(url).toBe(`https://example.test/api/auth/telegram/ticket/${token}/enter`);
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  it('/start с несуществующим/истёкшим тикетом не падает — обычное приветствие', async () => {
    await handleUpdate(msg(5560, '/start login_does-not-exist'), tg);
    expect(calls[0].payload.text).toContain('вопрос дня');
    const p = await getProfileByTelegramId(5560);
    expect(p).not.toBeNull(); // контакт всё равно сохраняется
  });

  it('/question присылает вопрос дня с оригиналом и переводом и кнопками A/B/C', async () => {
    await handleUpdate(msg(5552, '/start'), tg);
    calls.length = 0;
    await handleUpdate(msg(5552, '/question'), tg);
    const p = calls[0].payload;
    expect(p.text).toContain('ES');
    expect(p.text).toContain('RU');
    expect(p.text).toContain('Вопрос RU');
    expect(p.reply_markup.inline_keyboard[0].map((b: any) => b.text)).toEqual(['A', 'B', 'C']);
    expect(p.reply_markup.inline_keyboard[0][0].callback_data).toMatch(/^d:[0-9a-f-]{36}:a$/);
  });

  it('ответ через кнопку: верный — +1 в журнал; неверный — попадает в «Ошибки», приходит пояснение на русском', async () => {
    await handleUpdate(msg(5553, '/start'), tg);
    const q = (await getQuestionOfDay(madridDateKey()))!;
    const p = (await getProfileByTelegramId(5553))!;
    calls.length = 0;

    await handleUpdate({ callback_query: { id: 'cb1', from: { id: 5553 }, data: `d:${q.id}:b`, message: { chat: { id: 5553 }, message_id: 10 } } }, tg);
    expect((await getStats(p.id)).errors_open).toBe(1);
    const sent = calls.find((c) => c.method === 'sendMessage')!;
    expect(sent.payload.text).toContain('Неверно');
    expect(sent.payload.text).toContain('Пояснение RU');
    expect(calls.some((c) => c.method === 'editMessageReplyMarkup')).toBe(true);

    calls.length = 0;
    await handleUpdate({ callback_query: { id: 'cb2', from: { id: 5553 }, data: `d:${q.id}:a`, message: { chat: { id: 5553 }, message_id: 11 } } }, tg);
    expect(calls.find((c) => c.method === 'sendMessage')!.payload.text).toContain('Верно');
    expect((await getStats(p.id)).total_answers).toBe(2);
  });

  it('незнакомый пользователь и мусорные callback-данные безопасно игнорируются', async () => {
    await handleUpdate({ callback_query: { id: 'x', from: { id: 999999 }, data: 'd:00000000-0000-0000-0000-000000000000:a', message: { chat: { id: 1 }, message_id: 1 } } }, tg);
    expect(calls[0].method).toBe('answerCallbackQuery');
    calls.length = 0;
    await handleUpdate({ callback_query: { id: 'y', from: { id: 1 }, data: 'evil', message: { chat: { id: 1 }, message_id: 1 } } }, tg);
    expect(calls[0].method).toBe('answerCallbackQuery');
    await handleUpdate({ message: { text: '/start', from: { id: 1 }, chat: { id: 1, type: 'group' } } }, tg);
    await handleUpdate({}, tg);
  });

  it('/stop отключает рассылку', async () => {
    await handleUpdate(msg(5554, '/start'), tg);
    await handleUpdate(msg(5554, '/stop'), tg);
    expect((await getProfileByTelegramId(5554))!.notify).toBe(false);
  });

  it('рассылка: отправляет подписанным, блокировавшим бота отключает уведомления', async () => {
    const a = await makeUser();
    const b = await makeUser();
    const c = await makeUser();
    await db.query('update profiles set notify = false where id = $1', [c.id]);
    const send = vi.fn(async (method: string, payload: any) => {
      if (payload.chat_id === b.telegram_id) throw new TelegramError(403, 'Forbidden: bot was blocked by the user');
      return {};
    });
    const res = await sendDailyBroadcast(send, 0);
    expect(res).toMatchObject({ total: 2, sent: 1, blocked: 1, failed: 0 });
    expect(send.mock.calls.find((c) => c[1].chat_id === a.telegram_id)![1].text).toContain('Вопрос дня');
    expect((await getProfileByTelegramId(b.telegram_id))!.notify).toBe(false);
    // повторная рассылка уже не трогает заблокировавшего
    const res2 = await sendDailyBroadcast(send, 0);
    expect(res2.total).toBe(1);
  });
});

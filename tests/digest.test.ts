import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Db } from '../lib/db';
import { makeDb, makeUser, seedContent } from './helpers';
import { sendUsefulDigest, usefulDigestText, handleUpdate } from '../lib/bot';
import { TelegramError } from '../lib/telegram';
import { getProfile } from '../lib/repo/users';
import { listDigestPages, listDigestRecipients } from '../lib/repo/digest';

let db: Db;
const calls: { method: string; payload: any }[] = [];
const tg = vi.fn(async (method: string, payload: any) => {
  calls.push({ method, payload });
  return {};
});

async function page(slug: string, title: string, o: { status?: string; sort?: number; hy?: string; icon?: string; section?: string | null } = {}) {
  const r = await db.query(
    `insert into useful_pages (slug, icon, status, sort, title, summary, section_id)
     values ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7) returning id`,
    [slug, o.icon ?? '📄', o.status ?? 'published', o.sort ?? 0,
      JSON.stringify({ ru: title, ...(o.hy ? { hy: o.hy } : {}) }), JSON.stringify({ ru: `Кратко: ${title}` }), o.section ?? null],
  );
  return r[0].id as string;
}

/** Сдвигает активность пользователя в прошлое */
async function idle(userId: string, days: number) {
  await db.query(`update profiles set last_seen_at = now() - make_interval(days => $2::int) where id = $1`, [userId, days]);
}

beforeEach(async () => {
  db = await makeDb();
  await db.query('delete from useful_pages'); // миграции кладут стартовые материалы — для теста нужен чистый список
  calls.length = 0;
  tg.mockClear();
});
afterEach(async () => {
  await db.close();
});

describe('рассылка «Полезно» в бот', () => {
  it('шлёт тем, кто не заходил 2+ дня, и не шлёт активным', async () => {
    await page('a', 'Первый');
    const idleUser = await makeUser();
    await idle(idleUser.id, 3);
    const activeUser = await makeUser();
    await idle(activeUser.id, 1);
    const fresh = await makeUser(); // только что вошёл

    const r = await sendUsefulDigest(tg, 0);
    expect(r).toMatchObject({ candidates: 1, sent: 1 });
    expect(calls).toHaveLength(1);
    expect(calls[0].payload.chat_id).toBe(idleUser.telegram_id);
    expect(calls[0].payload.text).toContain('Первый');
    expect(calls[0].payload.text).toContain('Кратко: Первый');
    void activeUser; void fresh;
  });

  it('ответы на вопросы считаются активностью', async () => {
    await page('a', 'Первый');
    const ids = await seedContent(db, { tests: 1 });
    const u = await makeUser();
    await idle(u.id, 10);
    expect(await listDigestRecipients()).toHaveLength(1);
    await db.query(`insert into answer_log (user_id, question_id, chosen, correct, context) values ($1, $2, 'a', true, 'test')`, [u.id, ids[0][0]]);
    expect(await listDigestRecipients()).toHaveLength(0); // только что решал вопрос — не беспокоим
  });

  it('каждый раз следующий материал; повторов нет; когда всё прислано — молчим', async () => {
    await page('a', 'Первый', { sort: 1 });
    await page('b', 'Второй', { sort: 2 });
    const u = await makeUser();

    for (const expected of ['Первый', 'Второй']) {
      await idle(u.id, 5);
      await db.query('update useful_digest_log set sent_at = now() - interval \'4 days\' where user_id = $1', [u.id]); // прошла пауза между рассылками
      calls.length = 0;
      expect((await sendUsefulDigest(tg, 0)).sent).toBe(1);
      expect(calls[0].payload.text).toContain(expected);
      expect(calls[0].payload.reply_markup === undefined || JSON.stringify(calls[0].payload.reply_markup).includes('/useful/')).toBe(true);
    }
    await db.query('update useful_digest_log set sent_at = now() - interval \'4 days\' where user_id = $1', [u.id]);
    calls.length = 0;
    expect(await sendUsefulDigest(tg, 0)).toMatchObject({ sent: 0, nothing_new: 1 });
    expect(calls).toHaveLength(0);
  });

  it('не чаще раза в 3 дня', async () => {
    await page('a', 'Первый', { sort: 1 });
    await page('b', 'Второй', { sort: 2 });
    const u = await makeUser();
    await idle(u.id, 5);
    expect((await sendUsefulDigest(tg, 0)).sent).toBe(1);
    expect((await sendUsefulDigest(tg, 0)).candidates).toBe(0); // сразу второй раз — нельзя
  });

  it('только опубликованные; порядок как в приложении (разделы, затем страницы)', async () => {
    const s2 = (await db.query(`insert into useful_sections (title, sort) values ('{"ru":"Б"}'::jsonb, 2) returning id`))[0].id;
    const s1 = (await db.query(`insert into useful_sections (title, sort) values ('{"ru":"А"}'::jsonb, 1) returning id`))[0].id;
    await page('draft', 'Черновик', { status: 'draft', section: s1, sort: 0 });
    await page('late', 'Поздний', { section: s2, sort: 1 });
    await page('early', 'Ранний', { section: s1, sort: 5 });
    await page('loose', 'Без раздела', { sort: 0 });
    expect((await listDigestPages()).map((p) => p.slug)).toEqual(['early', 'late', 'loose']);
  });

  it('армянский заголовок для армянского перевода, иначе русский; HTML экранируется', async () => {
    await page('a', 'Справка <b>', { hy: 'Տեղեկանք' });
    const hyUser = await makeUser();
    await db.query(`update profiles set trans_lang = 'hy' where id = $1`, [hyUser.id]);
    await idle(hyUser.id, 4);
    const ruUser = await makeUser();
    await idle(ruUser.id, 4);
    await sendUsefulDigest(tg, 0);
    const byChat = Object.fromEntries(calls.map((c) => [c.payload.chat_id, c.payload.text as string]));
    expect(byChat[hyUser.telegram_id]).toContain('Տեղեկանք');
    expect(byChat[ruUser.telegram_id]).toContain('Справка &lt;b&gt;');
    expect(usefulDigestText({ icon: null, title: 'T', summary: '' })).not.toContain('undefined');
    expect(usefulDigestText({ icon: '🆕', title: 'T', summary: 'S' })).toBe(
      '📚 <b>Из раздела «Полезно»</b>\n\n🆕 <b>T</b>\n\nS\n\n<i>Откройте материал в приложении — там всё подробно, с шагами и ссылками.</i>',
    );
  });

  it('отключившие рассылку (/stop) и заблокированные не получают; блокировка бота выключает рассылку', async () => {
    await page('a', 'Первый');
    const stopped = await makeUser();
    await idle(stopped.id, 5);
    await handleUpdate({ message: { text: '/stop', from: { id: stopped.telegram_id, first_name: 'X' }, chat: { id: stopped.telegram_id, type: 'private' } } }, tg);
    const blockedByAdmin = await makeUser();
    await idle(blockedByAdmin.id, 5);
    await db.query('update profiles set blocked_at = now() where id = $1', [blockedByAdmin.id]);
    const botBlocked = await makeUser();
    await idle(botBlocked.id, 5);
    calls.length = 0;
    const failing = vi.fn(async () => {
      throw new TelegramError(403, 'bot was blocked by the user');
    });
    const r = await sendUsefulDigest(failing as any, 0);
    expect(r).toMatchObject({ candidates: 1, sent: 0, blocked: 1 });
    expect((await getProfile(botBlocked.id))!.notify).toBe(false);
    expect(await db.query('select 1 from useful_digest_log')).toHaveLength(0); // неотправленное не считается присланным
  });

  it('без опубликованных материалов никому ничего не шлём', async () => {
    const u = await makeUser();
    await idle(u.id, 9);
    expect(await sendUsefulDigest(tg, 0)).toMatchObject({ candidates: 0, sent: 0 });
    expect(calls).toHaveLength(0);
  });
});

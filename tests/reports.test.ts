import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Db } from '../lib/db';
import { makeDb, seedContent, makeUser } from './helpers';
import { upsertTelegramUser } from '../lib/repo/users';
import { countNewReports, createReport, listReports, setReportStatus } from '../lib/repo/reports';
import { RuleError } from '../lib/repo/progress';
import { ValidationError } from '../lib/repo/admin';
import { canSeeUseful } from '../lib/engine';
import { welcomeText } from '../lib/bot';
import { REPORTS_PER_DAY } from '../lib/reports';

let db: Db;
let ids: string[][];
beforeEach(async () => {
  db = await makeDb();
  ids = await seedContent(db, { tests: 1 });
});
afterEach(async () => {
  await db.close();
});

describe('«Сообщить о проблеме»', () => {
  it('сообщение попадает в админку со ссылкой на вопрос и пользователя', async () => {
    const u = await makeUser();
    await createReport(u.id, { questionId: ids[0][0], reason: 'bad_translation', comment: '  Перевод кривой  ', lang: 'ru' });
    expect(await countNewReports()).toBe(1);
    const r = await listReports({ status: 'new' });
    expect(r.total).toBe(1);
    expect(r.rows[0]).toMatchObject({ user_id: u.id, question_id: ids[0][0], reason: 'bad_translation', comment: 'Перевод кривой', lang: 'ru', status: 'new' });
    expect(r.rows[0].question_text).toBeTruthy();
  });

  it('повтор той же жалобы не плодит дубли, а обновляет комментарий', async () => {
    const u = await makeUser();
    await createReport(u.id, { questionId: ids[0][0], reason: 'wrong_answer', comment: 'раз' });
    await createReport(u.id, { questionId: ids[0][0], reason: 'wrong_answer', comment: 'два' });
    const r = await listReports({});
    expect(r.total).toBe(1);
    expect(r.rows[0].comment).toBe('два');
    // другая причина — отдельное сообщение; другой пользователь — тоже
    await createReport(u.id, { questionId: ids[0][0], reason: 'bad_image' });
    const u2 = await makeUser();
    await createReport(u2.id, { questionId: ids[0][0], reason: 'wrong_answer' });
    expect(await countNewReports()).toBe(3);
    expect((await listReports({})).rows[0].same_question).toBe(3);
  });

  it('проверяет входные данные', async () => {
    const u = await makeUser();
    const bad = (o: Record<string, unknown>) => createReport(u.id, { questionId: ids[0][0], reason: 'other', comment: 'x', ...o });
    await expect(bad({ reason: 'spam' })).rejects.toMatchObject({ code: 'bad_reason' });
    await expect(bad({ questionId: 'не-uuid' })).rejects.toMatchObject({ code: 'bad_question' });
    await expect(bad({ questionId: '00000000-0000-0000-0000-000000000000' })).rejects.toMatchObject({ code: 'bad_question' });
    await expect(bad({ comment: '   ' })).rejects.toMatchObject({ code: 'comment_required' }); // «Другое» без текста
    await expect(bad({ reason: 'bad_image', comment: undefined })).resolves.toBeUndefined();
    await expect(bad({ comment: 'a'.repeat(5000), reason: 'bad_translation' })).resolves.toBeUndefined();
    expect((await listReports({ reason: 'bad_translation' })).rows[0].comment).toHaveLength(1000);
  });

  it('есть суточный лимит на одного человека', async () => {
    const u = await makeUser();
    const flat = ids[0].slice(0, REPORTS_PER_DAY);
    for (const q of flat) await createReport(u.id, { questionId: q, reason: 'wrong_answer' });
    await expect(createReport(u.id, { questionId: ids[0][REPORTS_PER_DAY] ?? ids[0][0], reason: 'bad_image' })).rejects.toBeInstanceOf(RuleError);
  });

  it('админ отмечает решённым и возвращает; новые идут первыми', async () => {
    const admin = { ...(await upsertTelegramUser({ id: 1, first_name: 'Boss' })), is_admin: true };
    const u = await makeUser();
    await createReport(u.id, { questionId: ids[0][0], reason: 'wrong_answer' });
    await createReport(u.id, { questionId: ids[0][1], reason: 'bad_image' });
    const first = (await listReports({ status: 'new' })).rows;
    await setReportStatus(admin, first[0].id, 'resolved', 'исправил');
    expect(await countNewReports()).toBe(1);
    const all = (await listReports({})).rows;
    expect(all[0].status).toBe('new'); // новые выше решённых
    const done = all.find((x) => x.status === 'resolved')!;
    expect(done).toMatchObject({ admin_note: 'исправил' });
    expect(done.resolved_at).toBeTruthy();
    await setReportStatus(admin, done.id, 'new');
    expect(await countNewReports()).toBe(2);
    await expect(setReportStatus(admin, '00000000-0000-0000-0000-000000000000', 'resolved')).rejects.toBeInstanceOf(ValidationError);
  });

  it('жалобы удаляются вместе с пользователем', async () => {
    const u = await makeUser();
    await createReport(u.id, { questionId: ids[0][0], reason: 'wrong_answer' });
    await db.query('delete from profiles where id = $1', [u.id]);
    expect(await countNewReports()).toBe(0);
  });
});

describe('«Полезно» только с оплаченным доступом', () => {
  it('canSeeUseful: оплаченный и админ — да, остальные — нет', () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    const past = new Date(Date.now() - 86_400_000).toISOString();
    expect(canSeeUseful({ access_until: future, is_admin: false })).toBe(true);
    expect(canSeeUseful({ access_until: past, is_admin: false })).toBe(false);
    expect(canSeeUseful({ access_until: null, is_admin: false })).toBe(false);
    expect(canSeeUseful({ access_until: null, is_admin: true })).toBe(true);
  });
});

describe('приветствие бота', () => {
  it('экранирует имя и содержит кнопочную подсказку и команды', () => {
    const t = welcomeText('<b>Гар</b>');
    expect(t).toContain('&lt;b&gt;Гар&lt;/b&gt;');
    expect(t).toContain('вопрос дня');
    expect(t).toContain('/stats');
    expect(t.length).toBeLessThan(1024);
  });
});

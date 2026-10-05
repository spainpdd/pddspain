import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Db } from '../lib/db';
import { makeDb, seedContent } from './helpers';
import { upsertTelegramUser } from '../lib/repo/users';
import { recordPayment } from '../lib/repo/billing';
import { createInvoice, markInvoicePaid } from '../lib/repo/robokassa';
import {
  adminAddNote, adminBlock, adminDeleteNote, adminEndAccess, adminGrantDays, adminSetAccessUntil, adminSetAdmin, adminSetTags,
  getUserDetail, listAudit, listUsersAdmin, normalizeTags, exportUsers, listAllTags,
} from '../lib/repo/admin-users';
import { adminOverview, listPayments, paymentsOverview } from '../lib/repo/admin-stats';
import { toCsv, csvCell } from '../lib/csv';
import { ValidationError } from '../lib/repo/admin';

let db: Db;
let admin: Awaited<ReturnType<typeof upsertTelegramUser>>;
let ann: Awaited<ReturnType<typeof upsertTelegramUser>>;
let bob: Awaited<ReturnType<typeof upsertTelegramUser>>;

beforeEach(async () => {
  db = await makeDb();
  admin = await upsertTelegramUser({ id: 1, first_name: 'Boss', username: 'boss' });
  await db.query('update profiles set is_admin = true where id = $1', [admin.id]);
  admin = { ...admin, is_admin: true };
  ann = await upsertTelegramUser({ id: 2, first_name: 'Ann', username: 'ann_x' });
  bob = await upsertTelegramUser({ id: 3, first_name: 'Bob' });
});
afterEach(async () => {
  await db.close();
});

describe('список пользователей', () => {
  it('ищет по имени, username, Telegram ID и ID профиля', async () => {
    expect((await listUsersAdmin({ q: 'ann' })).rows.map((r) => r.id)).toEqual([ann.id]);
    expect((await listUsersAdmin({ q: '@ann_x' })).total).toBe(1);
    expect((await listUsersAdmin({ q: '3' })).rows.some((r) => r.id === bob.id)).toBe(true);
    expect((await listUsersAdmin({ q: bob.id })).rows.map((r) => r.id)).toEqual([bob.id]);
  });

  it('фильтры по доступу, админам и блокировке', async () => {
    await adminGrantDays(admin, ann.id, 100);
    await adminGrantDays(admin, bob.id, 3);
    expect((await listUsersAdmin({ filter: 'active' })).total).toBe(2);
    expect((await listUsersAdmin({ filter: 'expiring' })).rows.map((r) => r.id)).toEqual([bob.id]);
    expect((await listUsersAdmin({ filter: 'never' })).rows.map((r) => r.id)).toEqual([admin.id]);
    expect((await listUsersAdmin({ filter: 'admin' })).rows.map((r) => r.id)).toEqual([admin.id]);
    await adminBlock(admin, bob.id, true, 'спам');
    expect((await listUsersAdmin({ filter: 'blocked' })).rows.map((r) => r.id)).toEqual([bob.id]);
  });

  it('сортирует и делит на страницы, неизвестный фильтр и сортировка безопасны', async () => {
    const r = await listUsersAdmin({ sort: 'name', dir: 'asc', perPage: 2 });
    expect(r.rows).toHaveLength(2);
    expect(r.total).toBe(3);
    expect(r.rows[0].display_name).toBe('Ann');
    const p2 = await listUsersAdmin({ sort: 'name', dir: 'asc', perPage: 2, page: 2 });
    expect(p2.rows).toHaveLength(1);
    await expect(listUsersAdmin({ filter: "x'; drop table profiles;--", sort: 'zzz; --' })).resolves.toMatchObject({ total: 3 });
  });

  it('фильтр по тегу и список тегов', async () => {
    await adminSetTags(admin, ann.id, ['друг', 'Блогер ']);
    expect((await listUsersAdmin({ tag: 'друг' })).rows.map((r) => r.id)).toEqual([ann.id]);
    expect((await listAllTags()).map((t) => t.tag).sort()).toEqual(['блогер', 'друг']);
  });

  it('exportUsers отдаёт всех', async () => {
    expect(await exportUsers()).toHaveLength(3);
  });
});

describe('выдача доступа', () => {
  it('добавляет дни, пишет журнал и возвращает Telegram ID для уведомления', async () => {
    const r = await adminGrantDays(admin, ann.id, 30, 'подарок');
    expect(r.telegramId).toBe(2);
    const days = (new Date(r.until).getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(29.9);
    expect(days).toBeLessThan(30.1);
    const log = await listAudit({ user: ann.id });
    expect(log.rows[0]).toMatchObject({ action: 'grant_days', admin_name: 'Boss', target_name: 'Ann' });
    expect(log.rows[0].details).toMatchObject({ days: 30, reason: 'подарок' });
  });

  it('дни складываются с остатком, а убирание уменьшает', async () => {
    await adminGrantDays(admin, ann.id, 100);
    const r = await adminGrantDays(admin, ann.id, -40);
    const days = (new Date(r.until).getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(59.9);
    expect(days).toBeLessThan(60.1);
  });

  it('отвергает ноль, дробные и слишком большие значения, чужой id', async () => {
    for (const d of [0, 1.5, 4000, NaN]) await expect(adminGrantDays(admin, ann.id, d)).rejects.toBeInstanceOf(ValidationError);
    await expect(adminGrantDays(admin, '00000000-0000-0000-0000-000000000000', 5)).rejects.toBeInstanceOf(ValidationError);
    await expect(adminGrantDays(admin, 'bad', 5)).rejects.toBeInstanceOf(ValidationError);
  });

  it('точная дата, закрытие доступа', async () => {
    const r = await adminSetAccessUntil(admin, ann.id, '2099-12-31');
    expect(r.until.startsWith('2099-12-31')).toBe(true);
    await adminEndAccess(admin, ann.id, 'возврат');
    const d = await getUserDetail(ann.id);
    expect(new Date(d!.user.access_until!).getTime()).toBeLessThanOrEqual(Date.now());
    expect((await listAudit({ user: ann.id })).rows.map((a) => a.action)).toEqual(['end_access', 'set_access_until']);
    await expect(adminSetAccessUntil(admin, ann.id, '31.12.2030')).rejects.toBeInstanceOf(ValidationError);
    await expect(adminSetAccessUntil(admin, ann.id, '1999-01-01')).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('права и блокировка', () => {
  it('нельзя снять права администратора с самого себя', async () => {
    await expect(adminSetAdmin(admin, admin.id, false)).rejects.toThrow(/самого себя/);
    await adminSetAdmin(admin, ann.id, true);
    expect((await listUsersAdmin({ filter: 'admin' })).total).toBe(2);
  });

  it('последнего администратора снять нельзя', async () => {
    const outsider = { ...bob, is_admin: true } as typeof bob;
    await expect(adminSetAdmin(outsider, admin.id, false)).rejects.toThrow(/хотя бы один/);
  });

  it('блокировка: ставит и снимает, себя и админа блокировать нельзя', async () => {
    await expect(adminBlock(admin, admin.id, true)).rejects.toThrow(/самого себя/);
    await adminSetAdmin(admin, ann.id, true);
    await expect(adminBlock(admin, ann.id, true)).rejects.toThrow(/права администратора/);
    await adminBlock(admin, bob.id, true, 'мошенничество');
    let d = await getUserDetail(bob.id);
    expect(d!.user.blocked_at).not.toBeNull();
    expect(d!.user.blocked_reason).toBe('мошенничество');
    await adminBlock(admin, bob.id, false);
    d = await getUserDetail(bob.id);
    expect(d!.user.blocked_at).toBeNull();
    expect(d!.user.blocked_reason).toBeNull();
  });

  it('вход заблокированного пользователя виден в профиле (blocked_at приходит из upsert)', async () => {
    await adminBlock(admin, bob.id, true);
    const again = await upsertTelegramUser({ id: 3, first_name: 'Bob' });
    expect(again.blocked_at).not.toBeNull();
  });
});

describe('теги и заметки', () => {
  it('нормализует теги: нижний регистр, дубликаты, пробелы, лимиты', () => {
    expect(normalizeTags(' Друг , друг,БЛОГЕР  x ')).toEqual(['друг', 'блогер x']);
    expect(normalizeTags(['a', 'A', ''])).toEqual(['a']);
    expect(normalizeTags('x'.repeat(50))[0]).toHaveLength(30);
    expect(() => normalizeTags(Array.from({ length: 21 }, (_, i) => `t${i}`))).toThrow(ValidationError);
  });

  it('заметки: добавить, показать в карточке, удалить только свою у этого пользователя', async () => {
    await adminAddNote(admin, ann.id, '  друг семьи  ');
    await expect(adminAddNote(admin, ann.id, '   ')).rejects.toBeInstanceOf(ValidationError);
    await expect(adminAddNote(admin, ann.id, 'x'.repeat(2001))).rejects.toBeInstanceOf(ValidationError);
    let d = await getUserDetail(ann.id);
    expect(d!.notes).toHaveLength(1);
    expect(d!.notes[0]).toMatchObject({ body: 'друг семьи', author_name: 'Boss' });
    await adminDeleteNote(admin, bob.id, d!.notes[0].id); // не его заметка — ничего не удаляет
    expect((await getUserDetail(ann.id))!.notes).toHaveLength(1);
    await adminDeleteNote(admin, ann.id, d!.notes[0].id);
    d = await getUserDetail(ann.id);
    expect(d!.notes).toHaveLength(0);
  });
});

describe('карточка пользователя', () => {
  it('собирает статистику, прогресс, платежи и журнал', async () => {
    const ids = await seedContent(db, { tests: 1, size: 3 });
    await db.query(`insert into answer_log (user_id, question_id, chosen, correct, context) values ($1,$2,'a',true,'test'), ($1,$2,'b',false,'test')`, [ann.id, ids[0][0]]);
    await db.query(`insert into user_errors (user_id, question_id) values ($1,$2)`, [ann.id, ids[0][0]]);
    await db.query(`insert into test_progress (user_id, test_category, test_number, attempts, best_errors, last_errors, passed, last_attempt_at) values ($1,'official',1,2,1,1,true,now())`, [ann.id]);
    await recordPayment({ userId: ann.id, sessionId: 'rk:10001', amountCents: 490000, currency: 'rub' });
    const d = (await getUserDetail(ann.id))!;
    expect(d.stats).toMatchObject({ answers: 2, correct: 1, accuracy: 50, tests_passed: 1, errors_open: 1, errors_resolved: 0 });
    expect(d.daily).toHaveLength(30);
    expect(d.daily[29].n).toBe(2);
    expect(d.progress[0]).toMatchObject({ category: 'official', number: 1, passed: true });
    expect(d.payments).toHaveLength(1);
    expect(d.recent).toHaveLength(2);
    expect(await getUserDetail('not-an-id')).toBeNull();
  });
});

describe('платежи и обзор', () => {
  it('выручка не включает тестовые счета; ожидающие считаются отдельно', async () => {
    const live = await createInvoice({ userId: ann.id, kopecks: 490000, isTest: false, shownCurrency: 'EUR', shownAmount: 49 });
    await recordPayment({ userId: ann.id, sessionId: `rk:${live}`, amountCents: 490000, currency: 'rub' });
    await markInvoicePaid(live, {});
    const test = await createInvoice({ userId: bob.id, kopecks: 490000, isTest: true });
    await recordPayment({ userId: bob.id, sessionId: `rk:${test}`, amountCents: 490000, currency: 'rub' });
    await markInvoicePaid(test, {});
    await createInvoice({ userId: bob.id, kopecks: 490000, isTest: false });

    const o = await paymentsOverview();
    expect(o.rub.total).toBe(4900);
    expect(o.rub.today).toBe(4900);
    expect(o).toMatchObject({ paid_count: 1, test_paid_count: 1, pending_count: 1, buyers: 1, avg_check_rub: 4900 });
    expect(o.daily).toHaveLength(30);
    expect(o.monthly).toHaveLength(12);
    expect(o.monthly[11].sum).toBe(4900);

    expect((await listPayments({ filter: 'live' })).total).toBe(1);
    expect((await listPayments({ filter: 'test' })).total).toBe(1);
    expect((await listPayments({ filter: 'pending' })).total).toBe(1);
    expect((await listPayments({})).total).toBe(3);
    expect((await listPayments({ user: ann.id })).total).toBe(1);
    const row = (await listPayments({ filter: 'live' })).rows[0];
    expect(row).toMatchObject({ user_name: 'Ann', amount: 4900, currency: 'RUB', shown_currency: 'EUR', days_granted: 100 });
  });

  it('обзор считает пользователей и доступ', async () => {
    await adminGrantDays(admin, ann.id, 5);
    await adminBlock(admin, bob.id, true);
    const o = await adminOverview();
    expect(o).toMatchObject({ users: 3, active_access: 1, expiring7: 1, blocked: 1, admins: 1, new7: 3 });
    expect(o.signups_daily).toHaveLength(30);
    expect(o.recent_users).toHaveLength(3);
    expect(o.expiring.map((e) => e.id)).toEqual([ann.id]);
  });
});

describe('журнал', () => {
  it('фильтрует по действию и администратору, делит на страницы', async () => {
    await adminGrantDays(admin, ann.id, 5);
    await adminAddNote(admin, ann.id, 'x');
    await adminSetTags(admin, bob.id, ['t']);
    expect((await listAudit({})).total).toBe(3);
    expect((await listAudit({ action: 'note_add' })).total).toBe(1);
    expect((await listAudit({ admin: admin.id })).total).toBe(3);
    expect((await listAudit({ action: 'bogus' })).total).toBe(3); // неизвестный фильтр игнорируется
    expect((await listAudit({ perPage: 2 })).rows).toHaveLength(2);
    expect((await listAudit({ perPage: 2, page: 2 })).rows).toHaveLength(1);
  });
});

describe('CSV', () => {
  it('экранирует кавычки, разделители и формулы', () => {
    expect(csvCell('a;b')).toBe('"a;b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell('-5')).toBe('-5');
    expect(csvCell(null)).toBe('');
    expect(csvCell(new Date('2026-10-05T10:00:00Z'))).toBe('2026-10-05T10:00:00.000Z');
  });
  it('собирает файл с BOM и заголовком', () => {
    const t = toCsv([{ key: 'a', title: 'Имя' }, { key: 'b', title: 'N' }], [{ a: 'Ann', b: 1 }]);
    expect(t.startsWith('﻿Имя;N\r\n')).toBe(true);
    expect(t).toContain('Ann;1');
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Db } from '../lib/db';
import { makeDb, seedContent, makeUser, answersWithErrors } from './helpers';
import { listTests } from '../lib/repo/content';
import { submitTest, submitReview, getErrorBatch, submitErrors, submitDaily, RuleError } from '../lib/repo/progress';
import { getStats } from '../lib/repo/users';
import { recordPayment, grantDays, createClaim, revokeClaim } from '../lib/repo/billing';
import { getProfile } from '../lib/repo/users';
import { getQuestionOfDay } from '../lib/repo/content';
import { getPassedOfficialTests } from '../lib/repo/progress';

let db: Db;
let ids: string[][];

beforeEach(async () => {
  db = await makeDb();
  ids = await seedContent(db, { tests: 4 });
  delete process.env.SERVE_UNVERIFIED_QUESTIONS;
});
afterEach(async () => {
  await db.close();
});

describe('прохождение тестов', () => {
  it('в начале доступен только тест 1', async () => {
    const u = await makeUser();
    const list = await listTests(u.id);
    expect(list.map((t) => t.status)).toEqual(['available', 'locked', 'locked', 'locked']);
    expect(list[0].playable).toBe(30);
  });

  it('getPassedOfficialTests: только сданные (≤2 ошибок), 3+ ошибок — не сдан, цвет по best_errors', async () => {
    const u = await makeUser();
    await submitTest(u.id, 'official', 1, answersWithErrors(ids[0], 1));
    expect(await getPassedOfficialTests(u.id)).toEqual([1]);
    await submitTest(u.id, 'official', 2, answersWithErrors(ids[1], 3));
    expect(await getPassedOfficialTests(u.id)).toEqual([1]);
    const list = await listTests(u.id);
    expect(list[1]).toMatchObject({ status: 'available', best_errors: 3 });
    expect(list[2].status).toBe('locked');
  });

  it('0 ошибок → тест сдан, открывается следующий, ошибок в разделе нет', async () => {
    const u = await makeUser();
    const r = await submitTest(u.id, 'official', 1, answersWithErrors(ids[0], 0));
    expect(r).toMatchObject({ errors: 0, outcome: 'perfect', passed: true, nextTest: 2, wrongIds: [] });
    expect((await listTests(u.id)).map((t) => t.status)).toEqual(['passed', 'available', 'locked', 'locked']);
    expect((await getStats(u.id)).errors_open).toBe(0);
  });

  it('2 ошибки → сдан, ошибки сохранены в раздел «Ошибки», следующий открыт', async () => {
    const u = await makeUser();
    const r = await submitTest(u.id, 'official', 1, answersWithErrors(ids[0], 2));
    expect(r).toMatchObject({ errors: 2, outcome: 'pass_review', passed: true, nextTest: 2 });
    expect(r.wrongIds).toEqual([ids[0][0], ids[0][1]]);
    const st = await getStats(u.id);
    expect(st.errors_open).toBe(2);
    expect(st.total_answers).toBe(30);
    expect(st.total_correct).toBe(28);
  });

  it('3 ошибки → тест не сдан, следующий закрыт; пересдача с ≤2 открывает', async () => {
    const u = await makeUser();
    const r1 = await submitTest(u.id, 'official', 1, answersWithErrors(ids[0], 3));
    expect(r1).toMatchObject({ errors: 3, outcome: 'fail', passed: false, nextTest: null });
    expect((await listTests(u.id))[1].status).toBe('locked');
    await expect(submitTest(u.id, 'official', 2, answersWithErrors(ids[1], 0))).rejects.toMatchObject({ code: 'locked' });

    const r2 = await submitTest(u.id, 'official', 1, answersWithErrors(ids[0], 2));
    expect(r2).toMatchObject({ outcome: 'pass_review', passed: true, nextTest: 2 });
    const l = await listTests(u.id);
    expect(l[0]).toMatchObject({ status: 'passed', attempts: 2, best_errors: 2, last_errors: 2 });
    expect(l[1].status).toBe('available');
  });

  it('пересдача уже сданного теста с плохим результатом не закрывает цепочку заново', async () => {
    const u = await makeUser();
    await submitTest(u.id, 'official', 1, answersWithErrors(ids[0], 0));
    await submitTest(u.id, 'official', 1, answersWithErrors(ids[0], 10));
    const l = await listTests(u.id);
    expect(l[0]).toMatchObject({ status: 'passed', best_errors: 0, last_errors: 10 });
    expect(l[1].status).toBe('available');
  });

  it('неполный набор ответов и чужие вопросы отклоняются', async () => {
    const u = await makeUser();
    const partial = answersWithErrors(ids[0], 0);
    delete partial[ids[0][5]];
    await expect(submitTest(u.id, 'official', 1, partial)).rejects.toBeInstanceOf(RuleError);
    await expect(submitTest(u.id, 'official', 1, answersWithErrors(ids[1], 0))).rejects.toMatchObject({ code: 'incomplete' });
    await expect(submitTest(u.id, 'official', 99, {})).rejects.toMatchObject({ code: 'no_such_test' });
    expect((await getStats(u.id)).total_answers).toBe(0); // транзакция откатилась, ничего не записано
  });

  it('review-раунд пишет в журнал, но не меняет прогресс и ошибки', async () => {
    const u = await makeUser();
    await submitTest(u.id, 'official', 1, answersWithErrors(ids[0], 2));
    const before = await getStats(u.id);
    const rv = await submitReview(u.id, 'official', 1, { [ids[0][0]]: 'a', [ids[0][1]]: 'b' });
    expect(rv.logged).toBe(2);
    const after = await getStats(u.id);
    expect(after.total_answers).toBe(before.total_answers + 2);
    expect(after.errors_open).toBe(2); // ошибки остаются, пока не решены в разделе «Ошибки»
  });
});

describe('раздел «Ошибки»', () => {
  it('выдаёт не более 5; верный ответ убирает из очереди, неверный — оставляет', async () => {
    const u = await makeUser();
    await submitTest(u.id, 'official', 1, answersWithErrors(ids[0], 8)); // 8 ошибок
    expect((await getStats(u.id)).errors_open).toBe(8);

    const batch = await getErrorBatch(u.id);
    expect(batch).toHaveLength(5);

    // 3 верно, 2 неверно
    const ans = Object.fromEntries(batch.map((q, i) => [q.id, i < 3 ? 'a' : 'b']));
    const r = await submitErrors(u.id, ans);
    expect(r).toEqual({ correct: 3, wrong: 2, remaining: 5 });

    // следующая пачка не начинается с только что решённых: сначала те, что ещё не показывались
    const next = await getErrorBatch(u.id);
    expect(next).toHaveLength(5);
    const wrongJustNow = new Set(batch.slice(3).map((q) => q.id));
    const fresh = next.filter((q) => !wrongJustNow.has(q.id));
    expect(fresh.length).toBe(3); // 3 «непоказанных» идут первыми, затем 2 недавно ошибочных
    expect(next.slice(0, 3).every((q) => !wrongJustNow.has(q.id))).toBe(true);
  });

  it('чужой/не из очереди вопрос не принимается', async () => {
    const u = await makeUser();
    const r = await submitErrors(u.id, { [ids[0][0]]: 'a' });
    expect(r).toEqual({ correct: 0, wrong: 0, remaining: 0 });
  });

  it('повторная ошибка в тесте возвращает решённый вопрос в очередь', async () => {
    const u = await makeUser();
    await submitTest(u.id, 'official', 1, answersWithErrors(ids[0], 1));
    const b = await getErrorBatch(u.id);
    await submitErrors(u.id, { [b[0].id]: 'a' });
    expect((await getStats(u.id)).errors_open).toBe(0);
    await submitTest(u.id, 'official', 1, answersWithErrors(ids[0], 1));
    expect((await getStats(u.id)).errors_open).toBe(1);
  });

  it('ошибки одного пользователя не видны другому', async () => {
    const a = await makeUser();
    const b = await makeUser();
    await submitTest(a.id, 'official', 1, answersWithErrors(ids[0], 2));
    expect(await getErrorBatch(b.id)).toHaveLength(0);
  });
});

describe('вопрос дня', () => {
  it('стабилен в рамках даты; неверный ответ попадает в ошибки', async () => {
    const u = await makeUser();
    const q1 = await getQuestionOfDay('2026-09-21');
    const q2 = await getQuestionOfDay('2026-09-21');
    expect(q1!.id).toBe(q2!.id);
    const r = await submitDaily(u.id, q1!.id, 'c');
    expect(r.correct).toBe(false);
    expect((await getStats(u.id)).errors_open).toBe(1);
    const r2 = await submitDaily(u.id, q1!.id, 'a');
    expect(r2.correct).toBe(true);
  });
});

describe('права на вопросы (unverified не отдаём)', () => {
  it('вопросы unverified не попадают в тесты, пока не включён переключатель', async () => {
    const db2 = await makeDb();
    const idsU = await seedContent(db2, { tests: 1, rights: 'unverified' });
    const u = await makeUser();
    expect(await listTests(u.id)).toHaveLength(0);
    process.env.SERVE_UNVERIFIED_QUESTIONS = 'true';
    expect(await listTests(u.id)).toHaveLength(1);
    const r = await submitTest(u.id, 'official', 1, answersWithErrors(idsU[0], 0));
    expect(r.outcome).toBe('perfect');
    await db2.close();
  });
});

describe('оплата и гарантия', () => {
  it('оплата идемпотентна: повторный вебхук не продлевает второй раз', async () => {
    const u = await makeUser();
    const r1 = await recordPayment({ userId: u.id, sessionId: 'cs_1', amountCents: 5000 });
    const r2 = await recordPayment({ userId: u.id, sessionId: 'cs_1', amountCents: 5000 });
    expect(r1.granted).toBe(true);
    expect(r2.granted).toBe(false);
    const p = (await getProfile(u.id))!;
    const days = (new Date(p.access_until!).getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(99.9);
    expect(days).toBeLessThan(100.1);
    expect(p.guarantee_eligible).toBe(true);
  });

  it('вторая оплата (другая сессия) прибавляется к оставшемуся сроку', async () => {
    const u = await makeUser();
    await recordPayment({ userId: u.id, sessionId: 'cs_a', amountCents: 5000 });
    await recordPayment({ userId: u.id, sessionId: 'cs_b', amountCents: 5000 });
    const p = (await getProfile(u.id))!;
    const days = (new Date(p.access_until!).getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(199.9);
  });

  it('гарантия: «не сдал» → +30 дней; дубль по дате запрещён; «сдал» закрывает гарантию', async () => {
    const u = await makeUser();
    await recordPayment({ userId: u.id, sessionId: 'cs_g', amountCents: 5000 });
    const today = new Date().toISOString().slice(0, 10);

    const c1 = await createClaim(u.id, today, 'failed');
    expect(c1).toMatchObject({ ok: true, addDays: 30 });
    const p1 = (await getProfile(u.id))!;
    expect((new Date(p1.access_until!).getTime() - Date.now()) / 86_400_000).toBeGreaterThan(129.9);

    expect(await createClaim(u.id, today, 'failed')).toMatchObject({ ok: false, reason: 'duplicate' });

    // «сдал» проверяем на другой дате (на ту же дату заявка уже есть)
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    const c3 = await createClaim(u.id, yesterday, 'passed');
    expect(c3).toMatchObject({ ok: true, markPassed: true });
    expect((await getProfile(u.id))!.exam_passed_at).not.toBeNull();
    expect(await createClaim(u.id, yesterday, 'failed')).toMatchObject({ ok: false, reason: 'already_passed' });
  });

  it('без оплаты гарантия недоступна', async () => {
    const u = await makeUser();
    expect(await createClaim(u.id, new Date().toISOString().slice(0, 10), 'failed')).toMatchObject({
      ok: false,
      reason: 'not_eligible',
    });
  });

  it('админ может отозвать заявку — дни возвращаются', async () => {
    const u = await makeUser();
    await recordPayment({ userId: u.id, sessionId: 'cs_r', amountCents: 5000 });
    await createClaim(u.id, new Date().toISOString().slice(0, 10), 'failed');
    const [c] = await db.query('select id from exam_claims where user_id = $1', [u.id]);
    await revokeClaim(c.id);
    const days = (new Date((await getProfile(u.id))!.access_until!).getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(99.9);
    expect(days).toBeLessThan(100.1);
  });

  it('grantDays: ручная выдача и снятие', async () => {
    const u = await makeUser();
    await grantDays(u.id, 10);
    let p = (await getProfile(u.id))!;
    expect((new Date(p.access_until!).getTime() - Date.now()) / 86_400_000).toBeGreaterThan(9.9);
    await grantDays(u.id, -10);
    p = (await getProfile(u.id))!;
    expect((new Date(p.access_until!).getTime() - Date.now()) / 86_400_000).toBeLessThan(0.1);
  });
});

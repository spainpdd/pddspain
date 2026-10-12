import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Db } from '../lib/db';
import { makeDb, seedContent, makeUser, answersWithErrors } from './helpers';
import { submitTest } from '../lib/repo/progress';
import { errorTotals } from '../lib/repo/users';

let db: Db;
let ids: string[][];
beforeEach(async () => {
  db = await makeDb();
  ids = await seedContent(db, { tests: 2 });
});
afterEach(async () => {
  await db.close();
});

describe('ошибки без подписки', () => {
  it('копятся и считаются, хотя разбирать их можно только с доступом', async () => {
    const u = await makeUser(); // без оплаты
    expect(await errorTotals(u.id)).toEqual({ remaining: 0, questions: 0 });
    await submitTest(u.id, 'official', 1, answersWithErrors(ids[0], 4));
    expect(await errorTotals(u.id)).toEqual({ remaining: 4, questions: 4 });
    // повторная ошибка в том же вопросе увеличивает «повторения», но не число разных вопросов
    await submitTest(u.id, 'official', 1, answersWithErrors(ids[0], 2));
    const t = await errorTotals(u.id);
    expect(t.questions).toBe(4);
    expect(t.remaining).toBeGreaterThanOrEqual(4);
  });
});

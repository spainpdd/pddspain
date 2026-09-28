import { createPglite, applyMigrations, setDb, type Db } from '../lib/db';
import { upsertTelegramUser } from '../lib/repo/users';

export async function makeDb(): Promise<Db> {
  const db = await createPglite();
  await applyMigrations(db);
  setDb(db);
  return db;
}

/**
 * Создаёт `tests` тестов по `size` вопросов. Вопрос №i имеет верный ответ 'a'
 * (так проще имитировать ошибки: ответ 'b' = ошибка).
 */
export async function seedContent(
  db: Db,
  opts: { tests: number; size?: number; rights?: string; category?: 'official' | 'mixed' } = { tests: 3 },
) {
  const size = opts.size ?? 30;
  const category = opts.category ?? 'official';
  const ids: string[][] = [];
  for (let t = 1; t <= opts.tests; t++) {
    await db.query('insert into tests (category, number) values ($1,$2)', [category, t]);
    const row: string[] = [];
    for (let p = 1; p <= size; p++) {
      const q = (
        await db.query(
          `insert into questions (correct, rights_status) values ('a', $1) returning id`,
          [opts.rights ?? 'own'],
        )
      )[0];
      await db.query(
        `insert into question_translations (question_id, lang, text, option_a, option_b, option_c, explanation)
         values ($1, 'es', $2, 'A', 'B', 'C', 'Explicación')`,
        [q.id, `Pregunta ${t}.${p}`],
      );
      await db.query(
        'insert into test_questions (test_category, test_number, position, question_id) values ($1,$2,$3,$4)',
        [category, t, p, q.id],
      );
      row.push(q.id);
    }
    ids.push(row);
  }
  return ids;
}

let tgCounter = 1000;
export async function makeUser() {
  return upsertTelegramUser({ id: ++tgCounter, first_name: 'Test', username: 'u' + tgCounter });
}

/** Ответы на тест: первые `wrong` вопросов — неверно ('b'), остальные — верно ('a') */
export function answersWithErrors(ids: string[], wrong: number) {
  return Object.fromEntries(ids.map((id, i) => [id, i < wrong ? 'b' : 'a']));
}

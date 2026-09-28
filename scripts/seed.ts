/**
 * Стартовые данные для разработки/демо: 30 собственных вопросов (data/seed-questions.json) + тесты.
 *   npm run db:seed -- [--tests 3]
 * В продакшене вместо этого импортируйте свой банк: npm run questions:import
 */
import './_env';
import fs from 'node:fs';
import { validateDoc, importQuestions } from '../lib/questions-io';
import { buildTests } from '../lib/repo/admin';
import { getDb } from '../lib/db';

(async () => {
  const a = process.argv.slice(2);
  const tests = a.includes('--tests') ? Number(a[a.indexOf('--tests') + 1]) : 3;
  const { questions, errors } = validateDoc(JSON.parse(fs.readFileSync('data/seed-questions.json', 'utf8')));
  if (errors.length) throw new Error(errors.join('\n'));
  const r = await importQuestions(questions);
  console.log(`Вопросы: +${r.inserted} новых, ${r.updated} обновлено`);
  const t = await buildTests({ count: tests });
  console.log(`Тесты: создано ${t.created} (в демо-наборе всего ${t.poolSize} вопросов, поэтому тесты пересобирают одни и те же вопросы в разном порядке)`);
  await (await getDb()).close();
})().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});

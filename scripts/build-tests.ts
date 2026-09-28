/**
 * Автосборка тестов из доступных вопросов (только недостающие; существующие не трогает).
 *   npm run tests:build -- [--count 90] [--size 30]
 */
import './_env';
import { buildTests } from '../lib/repo/admin';
import { getDb } from '../lib/db';

(async () => {
  const a = process.argv.slice(2);
  const num = (k: string) => (a.includes(k) ? Number(a[a.indexOf(k) + 1]) : undefined);
  const r = await buildTests({ count: num('--count'), size: num('--size') });
  console.log(`Создано тестов: ${r.created}. Вопросов в пуле: ${r.poolSize}.`);
  if (r.poolSize < 90 * 30) console.log('Внимание: вопросов меньше, чем слотов (90×30) — вопросы повторяются между тестами.');
  await (await getDb()).close();
})().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});

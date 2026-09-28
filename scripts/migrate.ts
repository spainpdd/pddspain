import './_env';
import { getDb, applyMigrations } from '../lib/db';

(async () => {
  const db = await getDb();
  const done = await applyMigrations(db);
  console.log(done.length ? `Применено: ${done.join(', ')}` : 'Схема актуальна, нечего применять.');
  await db.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

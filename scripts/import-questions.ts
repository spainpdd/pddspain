/**
 * Импорт вопросов из JSON в формате dgt-pwa/questions@1.
 *
 *   npm run questions:import -- путь/к/файлу.json [--dry] [--no-tests] [--overwrite-tests] [--rights own|dgt_official|licensed|unverified]
 *
 * --rights принудительно ставит статус прав всем вопросам файла.
 * Без него берётся значение из файла, а если его нет — unverified (такие вопросы
 * пользователям не показываются, пока вы сознательно не смените статус в админке).
 */
import './_env';
import fs from 'node:fs';
import { validateDoc, importQuestions, importTests } from '../lib/questions-io';
import { getDb } from '../lib/db';
import { RIGHTS_STATUSES } from '../lib/types';

(async () => {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith('--'));
  const dry = args.includes('--dry');
  const ri = args.indexOf('--rights');
  const rights = ri >= 0 ? args[ri + 1] : null;
  if (!file) throw new Error('Укажите файл: npm run questions:import -- data.json [--dry] [--rights own]');
  if (rights && !(RIGHTS_STATUSES as string[]).includes(rights)) throw new Error(`--rights: один из ${RIGHTS_STATUSES.join(', ')}`);

  const { questions, tests, errors } = validateDoc(JSON.parse(fs.readFileSync(file, 'utf8')));
  if (rights) questions.forEach((q) => (q.rights_status = rights as any));
  console.log(`Прочитано: ${questions.length}, ошибок формата: ${errors.length}`);
  errors.slice(0, 20).forEach((e) => console.log('  ✗', e));
  if (dry) return console.log('Dry-run: в базу ничего не записано.');
  const r = await importQuestions(questions);
  console.log(`Готово: добавлено ${r.inserted}, обновлено ${r.updated}`);
  if (tests.length && !args.includes('--no-tests')) {
    const t = await importTests(tests, { overwrite: args.includes('--overwrite-tests') });
    console.log(`Тесты из файла: создано ${t.created}, пропущено (уже заполнены) ${t.skipped}, не найдено вопросов ${t.missingRefs}`);
  }
  await (await getDb()).close();
})().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});

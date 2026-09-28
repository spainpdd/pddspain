import { adminRoute } from '@/lib/admin-api';
import { fail, json, readJson } from '@/lib/api';
import { importQuestions, importTests, validateDoc } from '@/lib/questions-io';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const POST = (req: Request) =>
  adminRoute({}, async () => {
    const b = await readJson(req);
    if (!b?.doc) return fail(400, 'bad_request');
    const { questions, tests, errors } = validateDoc(b.doc);
    if (b.dry) return json({ dry: true, questions: questions.length, tests: tests.length, errors: errors.slice(0, 50), errorCount: errors.length });
    if (errors.length && !b.ignoreErrors) return fail(422, `В файле ${errors.length} ошибок формата. Сначала проверьте файл («Проверить»).`, { errors: errors.slice(0, 50) });
    const q = await importQuestions(questions);
    const t = tests.length ? await importTests(tests, { overwrite: !!b.overwriteTests }) : null;
    return json({ questions: q, tests: t, skipped: errors.length });
  });

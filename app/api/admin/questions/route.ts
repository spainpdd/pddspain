import { adminRoute } from '@/lib/admin-api';
import { fail, json, readJson } from '@/lib/api';
import { saveQuestion } from '@/lib/repo/admin';

export const dynamic = 'force-dynamic';

export const POST = (req: Request) =>
  adminRoute({}, async () => {
    const b = await readJson(req);
    if (!b) return fail(400, 'bad_json');
    return json({ id: await saveQuestion({ ...b, id: undefined }) });
  });

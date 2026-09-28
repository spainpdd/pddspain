import { adminRoute } from '@/lib/admin-api';
import { fail, json, readJson } from '@/lib/api';
import { setSlot } from '@/lib/repo/admin';
import { TEST_CATEGORIES, type TestCategory } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const PUT = (req: Request, { params }: { params: { category: string; n: string; pos: string } }) =>
  adminRoute({}, async () => {
    const category = params.category as TestCategory;
    if (!TEST_CATEGORIES.includes(category)) return fail(400, 'bad_request');
    const b = await readJson(req);
    const n = Number(params.n), pos = Number(params.pos);
    if (!b || typeof b.question_id !== 'string' || !Number.isInteger(n) || !Number.isInteger(pos)) return fail(400, 'bad_request');
    await setSlot(category, n, pos, b.question_id.trim());
    return json({ ok: true });
  });

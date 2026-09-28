import { adminRoute } from '@/lib/admin-api';
import { fail, json, readJson } from '@/lib/api';
import { renameTopic } from '@/lib/repo/admin';

export const dynamic = 'force-dynamic';

export const POST = (req: Request) =>
  adminRoute({}, async () => {
    const b = await readJson(req);
    if (!b || typeof b.from !== 'string' || typeof b.to !== 'string') return fail(400, 'bad_request');
    return json(await renameTopic(b.from, b.to));
  });

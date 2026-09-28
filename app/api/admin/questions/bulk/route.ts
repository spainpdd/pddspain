import { adminRoute } from '@/lib/admin-api';
import { fail, json, readJson } from '@/lib/api';
import { bulkUpdate } from '@/lib/repo/admin';

export const dynamic = 'force-dynamic';

export const POST = (req: Request) =>
  adminRoute({}, async () => {
    const b = await readJson(req);
    if (!b || !Array.isArray(b.ids) || typeof b.patch !== 'object') return fail(400, 'bad_request');
    const patch: Parameters<typeof bulkUpdate>[1] = {};
    if ('topic' in b.patch) patch.topic = b.patch.topic;
    if (b.patch.rights_status) patch.rights_status = b.patch.rights_status;
    if (typeof b.patch.is_active === 'boolean') patch.is_active = b.patch.is_active;
    return json(await bulkUpdate(b.ids, patch));
  });

import { adminRoute } from '@/lib/admin-api';
import { fail, json, readJson } from '@/lib/api';
import { grantDays } from '@/lib/repo/billing';

export const dynamic = 'force-dynamic';

export const POST = (req: Request, { params }: { params: { id: string } }) =>
  adminRoute({}, async () => {
    const b = await readJson(req);
    const days = Number(b?.days);
    if (!Number.isInteger(days) || days < -365 || days > 365 || !/^[0-9a-f-]{36}$/i.test(params.id)) return fail(400, 'bad_request');
    await grantDays(params.id, days);
    return json({ ok: true });
  });

import { adminRoute } from '@/lib/admin-api';
import { fail, json } from '@/lib/api';
import { revokeClaim } from '@/lib/repo/billing';

export const dynamic = 'force-dynamic';

export const POST = (_req: Request, { params }: { params: { id: string } }) =>
  adminRoute({}, async () => {
    if (!/^[0-9a-f-]{36}$/i.test(params.id)) return fail(400, 'bad_request');
    await revokeClaim(params.id);
    return json({ ok: true });
  });

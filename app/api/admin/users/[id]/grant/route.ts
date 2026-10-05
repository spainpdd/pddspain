import { adminRoute } from '@/lib/admin-api';
import { fail, json, readJson } from '@/lib/api';
import { adminGrantDays } from '@/lib/repo/admin-users';

export const dynamic = 'force-dynamic';

/** Совместимость со старой формой: выдача дней без уведомления. Новая форма — /action */
export const POST = (req: Request, { params }: { params: { id: string } }) =>
  adminRoute({}, async (admin) => {
    const b = await readJson(req);
    const days = Number(b?.days);
    if (!Number.isInteger(days) || !/^[0-9a-f-]{36}$/i.test(params.id)) return fail(400, 'bad_request');
    const r = await adminGrantDays(admin, params.id, days, b?.reason);
    return json({ ok: true, until: r.until });
  });

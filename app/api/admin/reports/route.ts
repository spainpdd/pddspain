import { adminRoute } from '@/lib/admin-api';
import { fail, json, readJson } from '@/lib/api';
import { setReportStatus } from '@/lib/repo/reports';

export const dynamic = 'force-dynamic';

/** Тело: { id, status: 'new' | 'resolved', note? } */
export const POST = (req: Request) =>
  adminRoute({}, async (admin) => {
    const b = await readJson(req);
    if (!b || typeof b.id !== 'string' || !['new', 'resolved'].includes(b.status)) return fail(400, 'bad_request');
    await setReportStatus(admin, b.id, b.status, b.note);
    return json({ ok: true });
  });

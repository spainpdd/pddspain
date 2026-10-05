import { adminRoute } from '@/lib/admin-api';
import { fail, json, readJson } from '@/lib/api';
import { getPricing, setPricing } from '@/lib/repo/config';

export const dynamic = 'force-dynamic';

export const GET = () => adminRoute({ mutating: false }, async () => json(await getPricing()));

export const PUT = (req: Request) =>
  adminRoute({}, async () => {
    const b = await readJson(req);
    if (!b) return fail(400, 'bad_request');
    const eur_cents = b.eur_cents !== undefined ? Number(b.eur_cents) : undefined;
    const rub = b.rub !== undefined ? Number(b.rub) : undefined;
    const amd = b.amd !== undefined ? Number(b.amd) : undefined;
    if (eur_cents !== undefined && (!Number.isFinite(eur_cents) || eur_cents <= 0)) return fail(422, 'bad_eur_cents');
    if (rub !== undefined && (!Number.isFinite(rub) || rub <= 0)) return fail(422, 'bad_rub');
    if (amd !== undefined && (!Number.isFinite(amd) || amd <= 0)) return fail(422, 'bad_amd');
    return json(await setPricing({ eur_cents, rub, amd }));
  });

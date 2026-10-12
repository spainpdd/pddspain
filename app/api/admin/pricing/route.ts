import { adminRoute } from '@/lib/admin-api';
import { fail, json, readJson } from '@/lib/api';
import { getPlanPrices, setPlanPrice } from '@/lib/repo/config';
import { DEFAULT_PLAN, isPlanId } from '@/lib/plans';

export const dynamic = 'force-dynamic';

export const GET = () => adminRoute({ mutating: false }, async () => json(await getPlanPrices()));

/** Тело: { plan?: 'week' | 'm2' | 'd100' (по умолчанию d100), eur_cents?, rub?, amd? } */
export const PUT = (req: Request) =>
  adminRoute({}, async () => {
    const b = await readJson(req);
    if (!b) return fail(400, 'bad_request');
    const plan = b.plan === undefined ? DEFAULT_PLAN : b.plan;
    if (!isPlanId(plan)) return fail(422, 'bad_plan');
    const eur_cents = b.eur_cents !== undefined ? Number(b.eur_cents) : undefined;
    const rub = b.rub !== undefined ? Number(b.rub) : undefined;
    const amd = b.amd !== undefined ? Number(b.amd) : undefined;
    if (eur_cents !== undefined && (!Number.isFinite(eur_cents) || eur_cents <= 0)) return fail(422, 'bad_eur_cents');
    if (rub !== undefined && (!Number.isFinite(rub) || rub <= 0)) return fail(422, 'bad_rub');
    if (amd !== undefined && (!Number.isFinite(amd) || amd <= 0)) return fail(422, 'bad_amd');
    return json(await setPlanPrice(plan, { eur_cents, rub, amd }));
  });

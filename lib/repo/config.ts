import { getDb } from '../db';
import { PRICE_CENTS } from '../engine';

/**
 * Цены полного доступа. Хранятся в app_config (key='pricing'), редактируются из админки.
 *  • rub      — то, что реально списывает Prodamus (рубли)
 *  • eur_cents / amd — цена, которую видят пользователи из Европы/Армении (пересчёт; курс плавает, обновляйте вручную)
 */
export interface Pricing {
  eur_cents: number;
  rub: number;
  amd: number;
}

export const DEFAULT_PRICING: Pricing = { eur_cents: PRICE_CENTS, rub: 4900, amd: 23900 };

function clampInt(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : fallback;
}

export async function getPricing(): Promise<Pricing> {
  const db = await getDb();
  const rows = await db.query<{ value: Pricing }>(`select value from app_config where key = 'pricing'`);
  const v = rows[0]?.value;
  if (!v) return DEFAULT_PRICING;
  return {
    eur_cents: clampInt(v.eur_cents, DEFAULT_PRICING.eur_cents),
    rub: clampInt(v.rub, DEFAULT_PRICING.rub),
    amd: clampInt(v.amd, DEFAULT_PRICING.amd),
  };
}

export async function setPricing(p: Partial<Pricing>): Promise<Pricing> {
  const current = await getPricing();
  const next: Pricing = {
    eur_cents: p.eur_cents !== undefined ? clampInt(p.eur_cents, current.eur_cents) : current.eur_cents,
    rub: p.rub !== undefined ? clampInt(p.rub, current.rub) : current.rub,
    amd: p.amd !== undefined ? clampInt(p.amd, current.amd) : current.amd,
  };
  const db = await getDb();
  await db.query(
    `insert into app_config (key, value, updated_at) values ('pricing', $1::jsonb, now())
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    [JSON.stringify(next)],
  );
  return next;
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Pricing } from '@/lib/repo/config';
import { PLANS, type PlanId } from '@/lib/plans';

async function call(url: string, method: string, body?: unknown) {
  const r = await fetch(url, { method, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({}));
  return { ok: r.ok, data: d };
}

type Draft = { eur: string; rub: string; amd: string };

export function PricingForm({ prices }: { prices: Record<PlanId, Pricing> }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Record<PlanId, Draft>>(() =>
    Object.fromEntries(
      PLANS.map((p) => [p.id, { eur: String(Math.round(prices[p.id].eur_cents / 100)), rub: String(prices[p.id].rub), amd: String(prices[p.id].amd) }]),
    ) as Record<PlanId, Draft>,
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const set = (id: PlanId, k: keyof Draft, v: string) => setDraft((d) => ({ ...d, [id]: { ...d[id], [k]: v } }));

  const save = async () => {
    setBusy(true);
    setMsg('');
    let ok = true;
    let err = '';
    for (const p of PLANS) {
      const d = draft[p.id];
      const r = await call('/api/admin/pricing', 'PUT', { plan: p.id, eur_cents: Math.round(Number(d.eur) * 100), rub: Number(d.rub), amd: Number(d.amd) });
      if (!r.ok) {
        ok = false;
        err = `${p.title}: ${r.data.error || 'ошибка'}`;
        break;
      }
    }
    setBusy(false);
    setMsg(ok ? 'Сохранено' : err);
    if (ok) router.refresh();
  };

  return (
    <div className="max-w-xl space-y-4">
      {PLANS.map((p) => (
        <div key={p.id} className="card space-y-3 p-5">
          <h2 className="font-semibold">{p.title}{p.guarantee ? ' (с гарантией «до сдачи»)' : ''}</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label">Европа, показ</label>
              <div className="flex items-center gap-2">
                <input value={draft[p.id].eur} onChange={(e) => set(p.id, 'eur', e.target.value)} className="input !w-24" inputMode="decimal" data-testid={`price-${p.id}-eur`} />
                <span className="text-slate-400">€</span>
              </div>
            </div>
            <div>
              <label className="label">Рубли, СПИСЫВАЕТСЯ</label>
              <div className="flex items-center gap-2">
                <input value={draft[p.id].rub} onChange={(e) => set(p.id, 'rub', e.target.value)} className="input !w-24" inputMode="numeric" data-testid={`price-${p.id}-rub`} />
                <span className="text-slate-400">₽</span>
              </div>
            </div>
            <div>
              <label className="label">Армения, показ</label>
              <div className="flex items-center gap-2">
                <input value={draft[p.id].amd} onChange={(e) => set(p.id, 'amd', e.target.value)} className="input !w-24" inputMode="numeric" data-testid={`price-${p.id}-amd`} />
                <span className="text-slate-400">֏</span>
              </div>
            </div>
          </div>
        </div>
      ))}
      <div className="flex items-center gap-3 pt-1">
        <button className="btn btn-primary btn-sm" onClick={save} disabled={busy} data-testid="price-save">Сохранить</button>
        {msg && <span className="text-xs text-slate-400">{msg}</span>}
      </div>
    </div>
  );
}

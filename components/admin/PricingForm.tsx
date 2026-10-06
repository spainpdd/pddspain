'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Pricing } from '@/lib/repo/config';

async function call(url: string, method: string, body?: unknown) {
  const r = await fetch(url, { method, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({}));
  return { ok: r.ok, data: d };
}

export function PricingForm({ pricing }: { pricing: Pricing }) {
  const router = useRouter();
  const [eur, setEur] = useState(String(Math.round(pricing.eur_cents / 100)));
  const [rub, setRub] = useState(String(pricing.rub));
  const [amd, setAmd] = useState(String(pricing.amd));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const save = async () => {
    setBusy(true);
    setMsg('');
    const { ok, data } = await call('/api/admin/pricing', 'PUT', {
      eur_cents: Math.round(Number(eur) * 100),
      rub: Number(rub),
      amd: Number(amd),
    });
    setBusy(false);
    setMsg(ok ? 'Сохранено' : data.error || 'Ошибка');
    if (ok) router.refresh();
  };

  return (
    <div className="card max-w-md space-y-4 p-5">
      <div>
        <label className="label">Цена для Европы (показывается в евро, не списывается)</label>
        <div className="flex items-center gap-2">
          <input value={eur} onChange={(e) => setEur(e.target.value)} className="input !w-32" inputMode="decimal" data-testid="price-eur" />
          <span className="text-slate-400">€ / 100 дней</span>
        </div>
      </div>
      <div>
        <label className="label">Цена в рублях (ЭТО списывается через Prodamus)</label>
        <div className="flex items-center gap-2">
          <input value={rub} onChange={(e) => setRub(e.target.value)} className="input !w-32" inputMode="numeric" data-testid="price-rub" />
          <span className="text-slate-400">₽</span>
        </div>
      </div>
      <div>
        <label className="label">Цена для Армении (показывается в драмах, не списывается)</label>
        <div className="flex items-center gap-2">
          <input value={amd} onChange={(e) => setAmd(e.target.value)} className="input !w-32" inputMode="numeric" data-testid="price-amd" />
          <span className="text-slate-400">֏</span>
        </div>
      </div>
      <div className="flex items-center gap-3 pt-1">
        <button className="btn btn-primary btn-sm" onClick={save} disabled={busy} data-testid="price-save">Сохранить</button>
        {msg && <span className="text-xs text-slate-400">{msg}</span>}
      </div>
    </div>
  );
}

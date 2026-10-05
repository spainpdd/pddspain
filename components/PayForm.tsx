'use client';

import { useState } from 'react';
import { DGT_BUYER_NOTICE } from '@/lib/legal-notes';

export default function PayForm({ configured }: { configured: boolean }) {
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pay = async () => {
    setBusy(true);
    setErr(null);
    const res = await fetch('/api/stripe/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ consent }) });
    const d = await res.json().catch(() => ({}));
    if (res.ok && d.url) {
      window.location.href = d.url;
      return;
    }
    setBusy(false);
    setErr(d.error === 'payments_not_configured' ? 'Оплата пока не подключена. Напишите нам — откроем доступ вручную.' : 'Не удалось начать оплату. Попробуйте ещё раз.');
  };

  return (
    <div className="space-y-4">
      <label className="flex items-start gap-3 text-left text-xs leading-relaxed text-slate-400">
        <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-blue-600" checked={consent} onChange={(e) => setConsent(e.target.checked)} data-testid="consent" />
        <span>
          Я согласен(на) на немедленное предоставление доступа и понимаю, что после начала использования сервиса теряю право на отказ от договора в течение 14 дней. Принимаю{' '}
          <a href="/legal" target="_blank" className="underline">условия</a>.
        </span>
      </label>
      <p className="text-[11px] leading-relaxed text-slate-500" data-testid="dgt-notice">{DGT_BUYER_NOTICE}</p>
      <button className="btn btn-primary w-full text-lg" disabled={!consent || busy || !configured} onClick={pay} data-testid="pay-btn">
        {busy ? 'Переходим к оплате…' : 'Оплатить 50 €'}
      </button>
      {!configured && <p className="text-xs text-amber-600">Оплата ещё не настроена (нет STRIPE_SECRET_KEY).</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}
    </div>
  );
}

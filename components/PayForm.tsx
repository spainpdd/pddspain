'use client';

import { useState } from 'react';
import { DGT_BUYER_NOTICE } from '@/lib/legal-notes';

export interface PlanView {
  id: string;
  title: string;
  days: number;
  price: string;
  perDay: string;
  guarantee: boolean;
  note: string | null;
}

export default function PayForm({ plans, defaultPlan, configured, testMode }: { plans: PlanView[]; defaultPlan: string; configured: boolean; testMode?: boolean }) {
  const [planId, setPlanId] = useState(defaultPlan);
  const plan = plans.find((p) => p.id === planId) ?? plans[0];
  const [consent, setConsent] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pay = async () => {
    setBusy(true);
    setErr(null);
    const res = await fetch('/api/pay/prodamus', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ plan: plan.id, consent, privacy }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok && d.url) {
      window.location.href = d.url;
      return;
    }
    setBusy(false);
    setErr(
      d.error === 'payments_not_configured'
        ? 'Оплата пока не подключена. Напишите нам — откроем доступ вручную.'
        : d.error === 'too_many_attempts'
          ? 'Слишком много попыток. Подождите немного и попробуйте снова.'
          : 'Не удалось начать оплату. Попробуйте ещё раз.',
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2.5" role="radiogroup" aria-label="Тариф" data-testid="plans">
        {plans.map((p) => {
          const on = p.id === plan.id;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setPlanId(p.id)}
              data-testid={`plan-${p.id}`}
              className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition ${on ? 'border-brand-600 bg-brand-500/5' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${on ? 'border-brand-600' : 'border-slate-300'}`} aria-hidden>
                {on && <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-slate-900">{p.title}</span>
                <span className="block text-xs text-slate-500" data-testid={`perday-${p.id}`}>≈ {p.perDay} в день{p.guarantee ? ' · с гарантией' : ''}</span>
              </span>
              <span className="text-lg font-bold text-slate-900">{p.price}</span>
            </button>
          );
        })}
      </div>
      {plan.note && <p className="text-[11px] leading-relaxed text-slate-500" data-testid="charge-note">{plan.note}</p>}
      {testMode && <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-700">Тестовый режим оплаты: деньги не списываются.</p>}
      <label className="flex items-start gap-3 text-left text-xs leading-relaxed text-slate-400">
        <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-blue-600" checked={consent} onChange={(e) => setConsent(e.target.checked)} data-testid="consent" />
        <span>
          Я принимаю условия{' '}
          <a href="/legal/offer" target="_blank" className="underline">публичной оферты</a>
          {' '}и согласен(на) на немедленное предоставление доступа к сервису после оплаты.
        </span>
      </label>
      <label className="flex items-start gap-3 text-left text-xs leading-relaxed text-slate-400">
        <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-blue-600" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} data-testid="privacy-consent" />
        <span>
          Я ознакомлен(а) с{' '}
          <a href="/legal/privacy" target="_blank" className="underline">политикой конфиденциальности</a>
          {' '}и даю{' '}
          <a href="/legal/consent" target="_blank" className="underline">согласие на обработку персональных данных</a>.
        </span>
      </label>
      <p className="text-[11px] leading-relaxed text-slate-500" data-testid="dgt-notice">{DGT_BUYER_NOTICE}</p>
      <button className="btn btn-primary w-full text-lg" disabled={!consent || !privacy || busy || !configured} onClick={pay} data-testid="pay-btn">
        {busy ? 'Переходим к оплате…' : `Оплатить ${plan.price}`}
      </button>
      {!configured && <p className="text-xs text-amber-600">Оплата ещё не настроена.</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}
    </div>
  );
}

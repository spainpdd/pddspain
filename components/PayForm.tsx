'use client';

import { useState } from 'react';
import { DGT_BUYER_NOTICE } from '@/lib/legal-notes';

export default function PayForm({ configured, priceLabel, testMode }: { configured: boolean; priceLabel: string; testMode?: boolean }) {
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
      body: JSON.stringify({ consent, privacy }),
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
        {busy ? 'Переходим к оплате…' : `Оплатить ${priceLabel}`}
      </button>
      {!configured && <p className="text-xs text-amber-600">Оплата ещё не настроена.</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}
    </div>
  );
}

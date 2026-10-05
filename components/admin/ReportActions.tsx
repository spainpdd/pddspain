'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/** Кнопки обработки сообщения: «Решено» с пометкой / «Вернуть в новые» */
export default function ReportActions({ id, status, note }: { id: string; status: 'new' | 'resolved'; note: string | null }) {
  const router = useRouter();
  const [text, setText] = useState(note ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function set(next: 'new' | 'resolved') {
    setBusy(true);
    setError('');
    const res = await fetch('/api/admin/reports', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, status: next, note: text }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) return setError('Не удалось сохранить');
    router.refresh();
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <input className="input min-w-0 flex-1 text-sm" placeholder="Пометка для себя (необязательно)" maxLength={500} value={text} onChange={(e) => setText(e.target.value)} />
      {status === 'new' ? (
        <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => set('resolved')} data-testid="report-resolve">Решено</button>
      ) : (
        <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => set('new')}>Вернуть в новые</button>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

async function call(url: string, method: string, body?: unknown) {
  const r = await fetch(url, { method, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({}));
  return { ok: r.ok, data: d };
}

export function RenameTopic({ topic, topics }: { topic: string; topics: string[] }) {
  const router = useRouter();
  const [val, setVal] = useState(topic);
  const [msg, setMsg] = useState('');
  const go = async () => {
    if (val === topic) return;
    const merge = topics.includes(val.trim());
    const { ok, data } = await call('/api/admin/topics/rename', 'POST', { from: topic, to: val });
    setMsg(ok ? `${merge ? 'Объединено' : 'Переименовано'}: ${data.updated}` : data.error);
    if (ok) router.refresh();
  };
  return (
    <div className="flex items-center gap-2">
      <input list="tl" value={val} onChange={(e) => setVal(e.target.value)} className="input !w-56" aria-label={`Новое имя для ${topic}`} data-testid="topic-input" />
      <datalist id="tl">{topics.map((t) => <option key={t} value={t} />)}</datalist>
      <button className="btn btn-ghost btn-sm" onClick={go} data-testid="topic-save">Сохранить</button>
      {msg && <span className="text-xs text-slate-400">{msg}</span>}
    </div>
  );
}

export function SlotEditor({ category, n, pos, current }: { category: string; n: number; pos: number; current: string }) {
  const router = useRouter();
  const [val, setVal] = useState(current);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const go = async () => {
    const { ok, data } = await call(`/api/admin/tests/${category}/${n}/slots/${pos}`, 'PUT', { question_id: val });
    setMsg({ ok, t: ok ? 'Заменено' : data.error });
    if (ok) router.refresh();
  };
  return (
    <div className="flex items-center gap-2">
      <input value={val} onChange={(e) => setVal(e.target.value)} className="input !w-72 font-mono !text-xs" aria-label="ID вопроса" />
      <button className="btn btn-ghost btn-sm" onClick={go} disabled={val === current}>Заменить</button>
      {msg && <span className={msg.ok ? 'text-xs text-green-400' : 'text-xs text-red-400'}>{msg.t}</span>}
    </div>
  );
}

export function GrantDays({ userId }: { userId: string }) {
  const router = useRouter();
  const [days, setDays] = useState('100');
  const [busy, setBusy] = useState(false);
  const go = async (sign: 1 | -1) => {
    setBusy(true);
    await call(`/api/admin/users/${userId}/grant`, 'POST', { days: sign * Number(days) });
    setBusy(false);
    router.refresh();
  };
  return (
    <div className="flex items-center gap-1">
      <input value={days} onChange={(e) => setDays(e.target.value)} className="input !w-16 !py-1.5" inputMode="numeric" aria-label="Дней" />
      <button disabled={busy} className="btn btn-primary btn-sm !px-2.5 !py-1.5" onClick={() => go(1)} title="Добавить дни">+</button>
      <button disabled={busy} className="btn btn-ghost btn-sm !px-2.5 !py-1.5" onClick={() => go(-1)} title="Убрать дни">−</button>
    </div>
  );
}

export function RevokeClaim({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button className="btn btn-ghost btn-sm" onClick={async () => { await call(`/api/admin/claims/${id}/revoke`, 'POST'); router.refresh(); }}>
      Отозвать
    </button>
  );
}

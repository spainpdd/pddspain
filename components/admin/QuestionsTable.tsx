'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface Row {
  id: string;
  text_es: string | null;
  correct: string;
  rights_status: string;
  is_active: boolean;
  topic: string | null;
  image_url: string | null;
  langs: Record<string, string> | null;
  tests: number[];
}

const RIGHTS: Record<string, [string, string]> = {
  own: ['свой', 'text-green-300'],
  dgt_official: ['DGT', 'text-green-300'],
  licensed: ['лицензия', 'text-green-300'],
  unverified: ['не подтв.', 'text-amber-300'],
};

export default function QuestionsTable({ rows, topics }: { rows: Row[]; topics: string[] }) {
  const router = useRouter();
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [topic, setTopic] = useState('');
  const [rights, setRights] = useState('');
  const [active, setActive] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const toggle = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const all = rows.length > 0 && sel.size === rows.length;

  const apply = async () => {
    const patch: Record<string, unknown> = {};
    if (topic) patch.topic = topic === '__none__' ? null : topic;
    if (rights) patch.rights_status = rights;
    if (active) patch.is_active = active === 'yes';
    if (!Object.keys(patch).length) return setMsg('Выберите, что изменить');
    setBusy(true);
    const r = await fetch('/api/admin/questions/bulk', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ids: [...sel], patch }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) { setMsg(`Изменено: ${d.updated}`); setSel(new Set()); router.refresh(); } else setMsg(d.error ?? 'Ошибка');
  };

  return (
    <div>
      {sel.size > 0 && (
        <div className="card sticky top-2 z-10 mb-3 flex flex-wrap items-center gap-2 p-3 text-sm" data-testid="bulk-bar">
          <b>Выбрано: {sel.size}</b>
          <input list="topics-list" placeholder="Новая тема" value={topic === '__none__' ? '' : topic} onChange={(e) => setTopic(e.target.value)} className="input !w-40" data-testid="bulk-topic" />
          <datalist id="topics-list">{topics.map((t) => <option key={t} value={t} />)}</datalist>
          <button className="btn btn-ghost btn-sm" onClick={() => setTopic('__none__')}>без темы</button>
          <select value={rights} onChange={(e) => setRights(e.target.value)} className="input !w-44">
            <option value="">Права: не менять</option>
            <option value="own">свой</option><option value="dgt_official">DGT официальный</option><option value="licensed">лицензия</option><option value="unverified">не подтверждено</option>
          </select>
          <select value={active} onChange={(e) => setActive(e.target.value)} className="input !w-40">
            <option value="">Активность: не менять</option><option value="yes">Показывать</option><option value="no">Скрыть</option>
          </select>
          <button className="btn btn-primary btn-sm" disabled={busy} onClick={apply} data-testid="bulk-apply">Применить</button>
          {msg && <span className="text-slate-400">{msg}</span>}
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-800 text-xs text-slate-500">
            <tr>
              <th className="p-3"><input type="checkbox" checked={all} onChange={() => setSel(all ? new Set() : new Set(rows.map((r) => r.id)))} aria-label="Выбрать все" /></th>
              <th className="p-3">Вопрос (ES)</th><th className="p-3">Тема</th><th className="p-3">Права</th>
              <th className="p-3">Переводы</th><th className="p-3">Тесты</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={cn('border-b border-slate-800/60 hover:bg-ink-800', !r.is_active && 'opacity-50')} data-testid="q-row">
                <td className="p-3"><input type="checkbox" checked={sel.has(r.id)} onChange={() => toggle(r.id)} aria-label="Выбрать" /></td>
                <td className="max-w-md p-3">
                  <Link href={`/admin/questions/${r.id}`} className="line-clamp-2 hover:text-brand-400">{r.text_es ?? '—'}</Link>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    ответ {r.correct.toUpperCase()}{r.image_url ? ' · 🖼' : ''}{!r.is_active ? ' · скрыт' : ''}
                  </div>
                </td>
                <td className="p-3 text-slate-400">{r.topic ?? '—'}</td>
                <td className={cn('p-3 text-xs', RIGHTS[r.rights_status]?.[1])}>{RIGHTS[r.rights_status]?.[0] ?? r.rights_status}</td>
                <td className="p-3">
                  <div className="flex gap-1 text-[10px] font-semibold">
                    {(['es', 'en', 'ru', 'hy'] as const).map((l) => {
                      const st = r.langs?.[l];
                      return <span key={l} title={st === 'reviewed' ? 'проверен' : st ? 'не проверен' : 'нет'} className={cn('rounded px-1.5 py-0.5', st === 'reviewed' ? 'bg-green-500/20 text-green-300' : st ? 'bg-amber-500/15 text-amber-300' : 'bg-slate-800 text-slate-600')}>{l.toUpperCase()}</span>;
                    })}
                  </div>
                </td>
                <td className="p-3 text-xs text-slate-500">{r.tests.length ? r.tests.slice(0, 4).join(', ') + (r.tests.length > 4 ? '…' : '') : '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">Ничего не найдено</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

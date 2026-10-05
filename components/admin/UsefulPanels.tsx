'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminSection } from '@/lib/repo/useful';

async function call(body: Record<string, unknown>) {
  const r = await fetch('/api/admin/useful', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  return { ok: r.ok, data: d as any };
}

/** Стрелки «выше / ниже» для материала */
export function MoveButtons({ id, first, last }: { id: string; first: boolean; last: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const go = async (dir: 'up' | 'down') => {
    setBusy(true);
    await call({ type: 'move_page', id, dir });
    setBusy(false);
    router.refresh();
  };
  return (
    <div className="flex gap-1">
      <button type="button" className="btn btn-ghost btn-sm !px-2.5" disabled={busy || first} onClick={() => go('up')} aria-label="Выше">↑</button>
      <button type="button" className="btn btn-ghost btn-sm !px-2.5" disabled={busy || last} onClick={() => go('down')} aria-label="Ниже">↓</button>
    </div>
  );
}

/** Разделы: добавить, переименовать (ru/hy), поменять порядок, удалить (материалы остаются без раздела) */
export function SectionsPanel({ sections }: { sections: AdminSection[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<Record<string, { ru: string; hy: string }>>({});
  const [fresh, setFresh] = useState({ ru: '', hy: '' });

  const run = async (body: Record<string, unknown>) => {
    setBusy(true);
    setMsg(null);
    const { ok, data } = await call(body);
    setBusy(false);
    if (!ok) setMsg(data?.error ?? 'Ошибка');
    else router.refresh();
    return ok;
  };
  const val = (s: AdminSection) => draft[s.id] ?? { ru: s.title.ru, hy: s.title.hy };

  return (
    <div className="card p-4">
      <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => setOpen((v) => !v)} aria-expanded={open} data-testid="sections-toggle">
        <span className="font-medium">Разделы <span className="text-sm font-normal text-slate-400">({sections.length})</span></span>
        <span className="text-slate-400">{open ? 'Свернуть' : 'Настроить'}</span>
      </button>
      {open && (
        <div className="mt-4 space-y-3">
          {sections.map((s, i) => (
            <div key={s.id} className="flex flex-wrap items-end gap-2 border-b border-slate-100 pb-3" data-testid="section-row">
              <div className="min-w-[10rem] flex-1">
                <label className="label">Название (русский)</label>
                <input className="input" value={val(s).ru} onChange={(e) => setDraft({ ...draft, [s.id]: { ...val(s), ru: e.target.value } })} />
              </div>
              <div className="min-w-[10rem] flex-1">
                <label className="label">Հայերեն (необязательно)</label>
                <input className="input" value={val(s).hy} onChange={(e) => setDraft({ ...draft, [s.id]: { ...val(s), hy: e.target.value } })} />
              </div>
              <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => run({ type: 'save_section', id: s.id, title: val(s) })}>Сохранить</button>
              <button type="button" className="btn btn-ghost btn-sm !px-2.5" disabled={busy || i === 0} onClick={() => run({ type: 'move_section', id: s.id, dir: 'up' })} aria-label="Выше">↑</button>
              <button type="button" className="btn btn-ghost btn-sm !px-2.5" disabled={busy || i === sections.length - 1} onClick={() => run({ type: 'move_section', id: s.id, dir: 'down' })} aria-label="Ниже">↓</button>
              <button
                type="button"
                className="btn btn-ghost btn-sm text-red-700"
                disabled={busy}
                onClick={() => {
                  if (confirm(`Удалить раздел «${s.title.ru}»? ${s.pages ? `Его материалы (${s.pages}) останутся без раздела.` : ''}`)) void run({ type: 'delete_section', id: s.id });
                }}
              >
                Удалить
              </button>
            </div>
          ))}
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[10rem] flex-1">
              <label className="label">Новый раздел (русский)</label>
              <input className="input" value={fresh.ru} onChange={(e) => setFresh({ ...fresh, ru: e.target.value })} placeholder="Например: Документы" data-testid="section-new-ru" />
            </div>
            <div className="min-w-[10rem] flex-1">
              <label className="label">Հայերեն (необязательно)</label>
              <input className="input" value={fresh.hy} onChange={(e) => setFresh({ ...fresh, hy: e.target.value })} />
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={busy || !fresh.ru.trim()}
              onClick={async () => {
                if (await run({ type: 'save_section', title: fresh })) setFresh({ ru: '', hy: '' });
              }}
              data-testid="section-add"
            >
              Добавить
            </button>
          </div>
          {msg && <p role="alert" className="text-sm text-red-700">{msg}</p>}
        </div>
      )}
    </div>
  );
}

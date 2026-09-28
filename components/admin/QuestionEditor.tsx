'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

type L = 'es' | 'en' | 'ru' | 'hy';
interface T { text: string; a: string; b: string; c: string; explanation: string; status: 'machine' | 'reviewed' }
export interface EditorInitial {
  id?: string;
  correct: 'a' | 'b' | 'c';
  image_url: string;
  topic: string;
  rights_status: string;
  source: string;
  is_active: boolean;
  i18n: Partial<Record<L, T>>;
  tests?: { test_category: string; test_number: number; position: number }[];
}

const empty = (): T => ({ text: '', a: '', b: '', c: '', explanation: '', status: 'machine' });
const LANG_NAMES: Record<L, string> = { es: 'Español (оригинал)', en: 'English', ru: 'Русский', hy: 'Հայերեն' };

export default function QuestionEditor({ initial, topics }: { initial: EditorInitial; topics: string[] }) {
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [tab, setTab] = useState<L>('es');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [dirty, setDirty] = useState(false);

  const set = (patch: Partial<EditorInitial>) => { setF((p) => ({ ...p, ...patch })); setDirty(true); setMsg(null); };
  const tr = (l: L): T => f.i18n[l] ?? empty();
  const setTr = (l: L, patch: Partial<T>) => set({ i18n: { ...f.i18n, [l]: { ...tr(l), ...patch } } });

  const save = async () => {
    setBusy(true);
    setMsg(null);
    const body = {
      correct: f.correct, image_url: f.image_url || null, topic: f.topic || null, rights_status: f.rights_status,
      source: f.source || null, is_active: f.is_active, i18n: f.i18n,
    };
    const res = await fetch(f.id ? `/api/admin/questions/${f.id}` : '/api/admin/questions', { method: f.id ? 'PUT' : 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: d.error ?? 'Не удалось сохранить' });
    setDirty(false);
    setMsg({ ok: true, text: 'Сохранено' });
    if (!f.id) router.replace(`/admin/questions/${d.id}`);
    else router.refresh();
  };

  const upload = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const r = await fetch('/api/admin/upload', { method: 'POST', body: fd });
    const d = await r.json().catch(() => ({}));
    if (r.ok) set({ image_url: d.url }); else setMsg({ ok: false, text: d.error ?? 'Не удалось загрузить' });
  };

  const cur = tr(tab);
  const es = tr('es');
  const filled = (l: L) => !!(f.i18n[l]?.text?.trim());

  return (
    <div className="space-y-5" data-testid="editor">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/admin/questions" className="text-sm text-slate-500 hover:text-slate-300">← К списку</Link>
        <div className="flex items-center gap-3">
          {msg && <span className={cn('text-sm', msg.ok ? 'text-green-400' : 'text-red-400')} role="status" data-testid="save-msg">{msg.text}</span>}
          {dirty && !msg && <span className="text-xs text-amber-400">есть несохранённые изменения</span>}
          <button className="btn btn-primary btn-sm" onClick={save} disabled={busy} data-testid="save">{busy ? 'Сохраняем…' : 'Сохранить'}</button>
        </div>
      </div>

      {/* общие поля */}
      <div className="card grid gap-4 p-4 md:grid-cols-3">
        <div>
          <span className="label">Правильный ответ</span>
          <div className="flex gap-1 rounded-xl bg-ink p-1">
            {(['a', 'b', 'c'] as const).map((c) => (
              <button key={c} type="button" onClick={() => set({ correct: c })} data-testid={`correct-${c}`}
                className={cn('flex-1 rounded-lg py-2 text-sm font-bold', f.correct === c ? 'bg-green-600 text-white' : 'text-slate-400')}>{c.toUpperCase()}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="topic">Тема</label>
          <input id="topic" list="topics-dl" className="input" value={f.topic} onChange={(e) => set({ topic: e.target.value })} data-testid="topic" />
          <datalist id="topics-dl">{topics.map((t) => <option key={t} value={t} />)}</datalist>
        </div>
        <div>
          <label className="label" htmlFor="rights">Происхождение прав</label>
          <select id="rights" className="input" value={f.rights_status} onChange={(e) => set({ rights_status: e.target.value })} data-testid="rights">
            <option value="own">own — написан мной</option>
            <option value="dgt_official">dgt_official — официальный DGT (без изменений, со ссылкой)</option>
            <option value="licensed">licensed — есть разрешение</option>
            <option value="unverified">unverified — права не подтверждены (скрыт от пользователей)</option>
          </select>
          {f.rights_status === 'dgt_official' && (
            <p className="mt-1 text-xs text-amber-400" data-testid="official-warning">
              DGT разрешает использовать свои материалы только без изменения содержания. Если правите формулировку или варианты — переведите вопрос в own. Переводы и пояснения добавлять можно.
            </p>
          )}
        </div>
        <div>
          <label className="label" htmlFor="source">Источник (пометка)</label>
          <input id="source" className="input" value={f.source} onChange={(e) => set({ source: e.target.value })} />
        </div>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input type="checkbox" checked={f.is_active} onChange={(e) => set({ is_active: e.target.checked })} className="h-4 w-4 accent-blue-600" data-testid="active" />
          Показывать пользователям
        </label>
        {f.tests && f.tests.length > 0 && (
          <div className="self-end pb-2 text-xs text-slate-500">В тестах: {f.tests.map((t) => `${t.test_category}:№${t.test_number}/${t.position}`).join(', ')}</div>
        )}
      </div>

      {/* картинка */}
      <div className="card flex flex-wrap items-start gap-4 p-4">
        <div className="min-w-[240px] flex-1">
          <label className="label" htmlFor="img">Картинка вопроса (URL)</label>
          <input id="img" className="input" placeholder="https://… или /q-images/…" value={f.image_url} onChange={(e) => set({ image_url: e.target.value })} data-testid="image-url" />
          <div className="mt-2 flex items-center gap-3">
            <label className="btn btn-ghost btn-sm cursor-pointer">
              Загрузить файл
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            </label>
            {f.image_url && <button className="text-xs text-slate-500 underline" onClick={() => set({ image_url: '' })}>убрать</button>}
          </div>
        </div>
        {f.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={f.image_url} alt="" className="max-h-28 rounded-xl bg-white p-1" />
        )}
      </div>

      {/* языки */}
      <div>
        <div className="mb-3 flex flex-wrap gap-1">
          {(['es', 'en', 'ru', 'hy'] as L[]).map((l) => (
            <button key={l} onClick={() => setTab(l)} data-testid={`tab-${l}`}
              className={cn('rounded-xl px-4 py-2 text-sm font-semibold', tab === l ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400')}>
              {l.toUpperCase()} {filled(l) ? (f.i18n[l]!.status === 'reviewed' ? '✓' : '•') : '—'}
            </button>
          ))}
        </div>

        <div className="card space-y-3 p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{LANG_NAMES[tab]}</h2>
            {tab !== 'es' && (
              <label className="flex items-center gap-2 text-xs text-slate-400">
                <input type="checkbox" className="accent-green-600" checked={cur.status === 'reviewed'} onChange={(e) => setTr(tab, { status: e.target.checked ? 'reviewed' : 'machine' })} />
                проверено человеком
              </label>
            )}
            {tab === 'es' && (
              <label className="flex items-center gap-2 text-xs text-slate-400">
                <input type="checkbox" className="accent-green-600" checked={cur.status === 'reviewed'} onChange={(e) => setTr('es', { status: e.target.checked ? 'reviewed' : 'machine' })} />
                проверено человеком
              </label>
            )}
          </div>

          {tab !== 'es' && es.text && (
            <div className="rounded-xl bg-ink p-3 text-xs text-slate-500">
              <div className="mb-1 font-semibold text-slate-400">Оригинал (ES)</div>
              <div>{es.text}</div>
              <div className="mt-1">A) {es.a} · B) {es.b}{es.c ? ` · C) ${es.c}` : ''}</div>
            </div>
          )}

          <div>
            <label className="label" htmlFor="t-text">Вопрос</label>
            <textarea id="t-text" rows={3} className="input" value={cur.text} onChange={(e) => setTr(tab, { text: e.target.value })} data-testid="t-text" />
          </div>
          {(['a', 'b', 'c'] as const).map((k) => (
            <div key={k}>
              <label className="label" htmlFor={`t-${k}`}>Вариант {k.toUpperCase()} {f.correct === k && <span className="text-green-400">· правильный</span>}{k === 'c' && <span className="text-slate-500"> · необязательно: пусто в ES = вопрос с двумя вариантами</span>}</label>
              <input id={`t-${k}`} className={cn('input', f.correct === k && 'border-green-600/60')} value={cur[k]} onChange={(e) => setTr(tab, { [k]: e.target.value } as Partial<T>)} data-testid={`t-${k}`} />
            </div>
          ))}
          <div>
            <label className="label" htmlFor="t-exp">Пояснение (открывается после ответа)</label>
            <textarea id="t-exp" rows={4} className="input" value={cur.explanation} onChange={(e) => setTr(tab, { explanation: e.target.value })} data-testid="t-exp" />
          </div>
          {tab !== 'es' && <p className="text-xs text-slate-500">Чтобы убрать перевод, очистите все поля этого языка и сохраните.</p>}
        </div>
      </div>
    </div>
  );
}

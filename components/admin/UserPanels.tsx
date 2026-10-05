'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

async function act(userId: string, body: Record<string, unknown>) {
  const r = await fetch(`/api/admin/users/${userId}/action`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  return { ok: r.ok, data: d as any };
}

const ERR: Record<string, string> = { bad_request: 'Неверный запрос', forbidden: 'Нет прав', unauthorized: 'Нужно войти заново', server_error: 'Ошибка сервера', unknown_action: 'Неизвестное действие', bad_origin: 'Запрос с чужого адреса' };
const errText = (d: any) => (d?.error ? ERR[d.error] ?? d.error : 'Ошибка');

function useAction(userId: string) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const run = async (body: Record<string, unknown>, okText: (d: any) => string) => {
    setBusy(true);
    setMsg(null);
    const { ok, data } = await act(userId, body);
    setBusy(false);
    setMsg({ ok, t: ok ? okText(data) : errText(data) });
    if (ok) router.refresh();
    return ok;
  };
  return { busy, msg, run };
}

function Msg({ m }: { m: { ok: boolean; t: string } | null }) {
  return m ? <p role="status" className={`mt-2 text-sm ${m.ok ? 'text-green-700' : 'text-red-700'}`}>{m.t}</p> : null;
}

/** Двухшаговое подтверждение опасных действий */
function Confirm({ label, onYes, busy, tone = 'ghost' }: { label: string; onYes: () => void; busy: boolean; tone?: 'ghost' | 'danger' }) {
  const [ask, setAsk] = useState(false);
  if (!ask) return <button type="button" className={`btn btn-sm ${tone === 'danger' ? 'bg-red-600 text-white hover:bg-red-500' : 'btn-ghost'}`} onClick={() => setAsk(true)} disabled={busy}>{label}</button>;
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      Точно?
      <button type="button" className="btn btn-sm bg-red-600 text-white hover:bg-red-500" onClick={() => { setAsk(false); onYes(); }} disabled={busy}>Да</button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAsk(false)}>Нет</button>
    </span>
  );
}

// ------------------------------------------------------------------ доступ

export function AccessPanel({ userId, until }: { userId: string; until: string | null }) {
  const { busy, msg, run } = useAction(userId);
  const [days, setDays] = useState('30');
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [notify, setNotify] = useState(true);
  const fmt = (d: any) => `Готово. Доступ до ${new Date(d.until).toLocaleDateString('ru-RU')}${d.notified ? ' · пользователю отправлено уведомление' : ''}`;
  const grant = (n: number) => run({ type: 'grant', days: n, reason, notify }, fmt);
  const dn = Number(days);
  const okDays = Number.isInteger(dn) && dn > 0 && dn <= 3650;

  return (
    <section className="card p-5" aria-labelledby="h-access">
      <h2 id="h-access" className="mb-3 font-semibold">Доступ</h2>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Быстрая выдача">
        {[[30, '+1 месяц'], [100, '+100 дней'], [180, '+6 месяцев'], [365, '+1 год']].map(([n, t]) => (
          <button key={n} type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => grant(Number(n))}>{t}</button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-2">
        <div>
          <label className="label" htmlFor="days">Своё число дней</label>
          <input id="days" value={days} onChange={(e) => setDays(e.target.value)} inputMode="numeric" className="input !w-24" />
        </div>
        <button type="button" className="btn btn-ghost btn-sm" disabled={busy || !okDays} onClick={() => grant(dn)}>Добавить</button>
        <button type="button" className="btn btn-ghost btn-sm" disabled={busy || !okDays} onClick={() => grant(-dn)}>Убрать</button>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-2">
        <div>
          <label className="label" htmlFor="until-date">Или точная дата окончания</label>
          <input id="until-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input !w-44" />
        </div>
        <button type="button" className="btn btn-ghost btn-sm" disabled={busy || !date} onClick={() => run({ type: 'set_until', date, reason, notify }, fmt)}>Установить</button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="reason">Причина (попадёт в журнал)</label>
          <input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="например: подарок другу" className="input" />
        </div>
        <label className="flex items-center gap-2 self-end text-sm text-slate-700">
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> Уведомить пользователя в Telegram
        </label>
      </div>

      {until && new Date(until).getTime() > Date.now() && (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <Confirm label="Закрыть доступ сейчас" busy={busy} onYes={() => run({ type: 'end_access', reason }, () => 'Доступ закрыт')} />
        </div>
      )}
      <Msg m={msg} />
    </section>
  );
}

// ------------------------------------------------------------------ аккаунт

export function AccountPanel({ userId, isAdmin, blocked, blockedReason, isSelf }: { userId: string; isAdmin: boolean; blocked: boolean; blockedReason: string | null; isSelf: boolean }) {
  const { busy, msg, run } = useAction(userId);
  const [reason, setReason] = useState('');
  return (
    <section className="card p-5" aria-labelledby="h-account">
      <h2 id="h-account" className="mb-3 font-semibold">Аккаунт</h2>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm">Права администратора: <b>{isAdmin ? 'есть' : 'нет'}</b></span>
        {isAdmin
          ? (isSelf ? <span className="text-xs text-slate-400">с себя снять нельзя</span> : <Confirm label="Снять права" busy={busy} onYes={() => run({ type: 'set_admin', on: false }, () => 'Права сняты')} />)
          : <Confirm label="Сделать администратором" busy={busy} onYes={() => run({ type: 'set_admin', on: true }, () => 'Теперь администратор')} />}
      </div>

      <div className="mt-4 border-t border-slate-200 pt-4">
        {blocked ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-red-700">Заблокирован{blockedReason ? `: ${blockedReason}` : ''}</span>
            <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => run({ type: 'unblock' }, () => 'Разблокирован')}>Разблокировать</button>
          </div>
        ) : isSelf ? (
          <span className="text-xs text-slate-400">себя заблокировать нельзя</span>
        ) : (
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="label" htmlFor="block-reason">Причина блокировки</label>
              <input id="block-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} className="input !w-72" />
            </div>
            <Confirm tone="danger" label="Заблокировать" busy={busy} onYes={() => run({ type: 'block', reason }, () => 'Заблокирован: вход и доступ закрыты')} />
          </div>
        )}
        <p className="mt-2 text-xs text-slate-400">Заблокированный не может войти, не получает рассылку; данные и история сохраняются.</p>
      </div>
      <Msg m={msg} />
    </section>
  );
}

// ------------------------------------------------------------------ теги

export function TagsEditor({ userId, tags, known }: { userId: string; tags: string[]; known: string[] }) {
  const { busy, msg, run } = useAction(userId);
  const [list, setList] = useState(tags);
  const [val, setVal] = useState('');
  const save = (next: string[]) => run({ type: 'tags', tags: next }, () => 'Теги сохранены').then((ok) => ok && setList(next));
  const add = () => {
    const t = val.trim().toLowerCase();
    if (!t || list.includes(t)) return setVal('');
    setVal('');
    void save([...list, t]);
  };
  return (
    <section className="card p-5" aria-labelledby="h-tags">
      <h2 id="h-tags" className="mb-3 font-semibold">Теги</h2>
      <div className="flex flex-wrap gap-1.5">
        {list.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-1 text-xs">
            {t}
            <button type="button" aria-label={`Убрать тег ${t}`} className="text-slate-500 hover:text-red-600" disabled={busy} onClick={() => save(list.filter((x) => x !== t))}>×</button>
          </span>
        ))}
        {!list.length && <span className="text-sm text-slate-400">Тегов нет</span>}
      </div>
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <input list="known-tags" value={val} onChange={(e) => setVal(e.target.value)} maxLength={30} placeholder="друг, блогер, возврат…" className="input !w-56" aria-label="Новый тег" />
        <datalist id="known-tags">{known.filter((k) => !list.includes(k)).map((k) => <option key={k} value={k} />)}</datalist>
        <button className="btn btn-ghost btn-sm" disabled={busy || !val.trim()}>Добавить</button>
      </form>
      <Msg m={msg} />
    </section>
  );
}

// ------------------------------------------------------------------ заметки

export function NotesPanel({ userId, notes }: { userId: string; notes: { id: number; author_name: string | null; body: string; created_at: string }[] }) {
  const { busy, msg, run } = useAction(userId);
  const [body, setBody] = useState('');
  return (
    <section className="card p-5" aria-labelledby="h-notes">
      <h2 id="h-notes" className="mb-3 font-semibold">Заметки</h2>
      <form onSubmit={async (e) => { e.preventDefault(); if (await run({ type: 'note_add', body }, () => 'Заметка добавлена')) setBody(''); }}>
        <label className="label" htmlFor="note">Новая заметка (видят только администраторы)</label>
        <textarea id="note" value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} rows={2} className="input" />
        <button className="btn btn-primary btn-sm mt-2" disabled={busy || !body.trim()}>Сохранить заметку</button>
      </form>
      <ul className="mt-4 space-y-3">
        {notes.map((n) => (
          <li key={n.id} className="rounded-xl bg-slate-50 p-3 text-sm">
            <p className="whitespace-pre-wrap">{n.body}</p>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
              <span>{n.author_name ?? '—'} · {new Date(n.created_at).toLocaleString('ru-RU', { timeZone: 'Europe/Madrid' })}</span>
              <button type="button" className="hover:text-red-600" disabled={busy} onClick={() => run({ type: 'note_delete', noteId: n.id }, () => 'Заметка удалена')}>Удалить</button>
            </div>
          </li>
        ))}
        {!notes.length && <li className="text-sm text-slate-400">Заметок нет</li>}
      </ul>
      <Msg m={msg} />
    </section>
  );
}

// ------------------------------------------------------------------ проверки (закрепление)

export function CheckpointsPanel({ userId, items }: { userId: string; items: { milestone: number; kind: 'mid' | 'final'; tests: number; status: 'locked' | 'available' | 'passed' }[] }) {
  const { busy, msg, run } = useAction(userId);
  const label = { locked: 'не открыта', available: 'доступна', passed: 'сдана' } as const;
  const tone = { locked: 'bg-slate-100 text-slate-500', available: 'bg-amber-100 text-amber-800', passed: 'bg-green-100 text-green-800' } as const;
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {items.map((c) => (
          <div key={c.milestone} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm" data-testid={`cp-${c.milestone}`}>
            <span className="font-medium">{c.kind === 'final' ? 'Финал' : `После ${c.milestone}`}</span>
            <span className="text-xs text-slate-400">{c.tests} тестов</span>
            <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${tone[c.status]}`}>{label[c.status]}</span>
            {c.status !== 'passed' && (
              <Confirm label="Засчитать" busy={busy} onYes={() => run({ type: 'check_clear', milestone: c.milestone }, () => 'Проверка засчитана')} />
            )}
          </div>
        ))}
      </div>
      <Msg m={msg} />
    </div>
  );
}

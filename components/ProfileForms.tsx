'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { StudyLang, TransLang } from '@/lib/types';
import { cn } from '@/lib/utils';

async function patchMe(body: Record<string, unknown>) {
  await fetch('/api/me', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
}

export function SettingsForm(props: { study: StudyLang; trans: TransLang; auto: boolean; notify: boolean }) {
  const [s, setS] = useState(props);
  const [saved, setSaved] = useState(false);
  const update = (patch: Partial<typeof s>) => {
    const n = { ...s, ...patch };
    setS(n);
    setSaved(false);
    patchMe({ study_lang: n.study, trans_lang: n.trans, auto_translate: n.auto, notify: n.notify }).then(() => setSaved(true));
  };
  const seg = (active: boolean) => cn('flex-1 rounded-lg py-2 text-sm font-semibold transition', active ? 'bg-brand-600 text-white' : 'text-slate-400');

  return (
    <div className="card space-y-4 p-4">
      <div>
        <span className="label">Учу билеты на</span>
        <div className="flex gap-1 rounded-xl bg-ink p-1">
          {(['es', 'en'] as StudyLang[]).map((l) => (
            <button key={l} className={seg(s.study === l)} onClick={() => update({ study: l })}>{l === 'es' ? 'Español' : 'English'}</button>
          ))}
        </div>
      </div>
      <div>
        <span className="label">Перевод</span>
        <div className="flex gap-1 rounded-xl bg-ink p-1">
          {(['ru', 'hy'] as TransLang[]).map((l) => (
            <button key={l} className={seg(s.trans === l)} onClick={() => update({ trans: l })}>{l === 'ru' ? 'Русский' : 'Հայերեն'}</button>
          ))}
        </div>
      </div>
      <Toggle label="Показывать перевод сразу" checked={s.auto} onChange={(v) => update({ auto: v })} />
      <Toggle label="«Вопрос дня» в Telegram" checked={s.notify} onChange={(v) => update({ notify: v })} />
      <p className="h-4 text-xs text-slate-500">{saved ? 'Сохранено' : ''}</p>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex w-full items-center justify-between text-left text-sm">
      <span>{label}</span>
      <span className={cn('h-6 w-11 rounded-full p-0.5 transition', checked ? 'bg-brand-600' : 'bg-slate-300')}>
        <span className={cn('block h-5 w-5 rounded-full bg-white transition', checked && 'translate-x-5')} />
      </span>
    </button>
  );
}

export function ClaimForm() {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const send = async (result: 'failed' | 'passed') => {
    setBusy(true);
    setMsg(null);
    const res = await fetch('/api/claims', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ exam_date: date, result }) });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setMsg({ ok: true, text: d.passed ? 'Поздравляем со сдачей! 🎉' : `Доступ продлён на ${d.addedDays} дн.` });
      router.refresh();
    } else {
      const reasons: Record<string, string> = {
        duplicate: 'На эту дату экзамена заявка уже есть.',
        future_date: 'Дата экзамена не может быть в будущем.',
        before_payment: 'Дата экзамена раньше оплаты.',
        already_passed: 'Вы уже отметили, что сдали экзамен.',
        not_eligible: 'Гарантия действует после оплаты.',
        bad_date: 'Укажите дату экзамена.',
      };
      setMsg({ ok: false, text: reasons[d.error] ?? 'Не удалось отправить заявку.' });
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="label" htmlFor="exam-date">Дата экзамена</label>
        <input id="exam-date" type="date" className="input" value={date} max={today} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button disabled={busy} className="btn btn-ghost btn-sm" onClick={() => send('failed')}>Не сдал(а)</button>
        <button disabled={busy} className="btn btn-primary btn-sm" onClick={() => send('passed')}>Сдал(а)!</button>
      </div>
      {msg && <p className={cn('text-sm', msg.ok ? 'text-green-600' : 'text-red-600')}>{msg.text}</p>}
    </div>
  );
}

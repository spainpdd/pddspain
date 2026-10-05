'use client';

import { useState } from 'react';
import { REPORT_COMMENT_MAX, REPORT_REASONS, type ReportReason } from '@/lib/reports';

type Phase = 'idle' | 'open' | 'sending' | 'sent';

/** «Сообщить о проблеме» под пояснением к вопросу: причина + комментарий, уходит в админку */
export default function ReportButton({ questionId, lang }: { questionId: string; lang: string }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [reason, setReason] = useState<ReportReason>('wrong_answer');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const close = () => {
    setPhase('idle');
    setError('');
  };

  async function send() {
    if (reason === 'other' && !comment.trim()) {
      setError('Опишите проблему в комментарии');
      return;
    }
    setPhase('sending');
    setError('');
    try {
      const res = await fetch(`/api/questions/${questionId}/report`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reason, comment, lang }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error === 'too_many' ? 'Слишком много сообщений за сутки. Попробуйте завтра.' : 'Не удалось отправить. Попробуйте ещё раз.');
      }
      setPhase('sent');
      setComment('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось отправить');
      setPhase('open');
    }
  }

  return (
    <>
      <div className="mt-6 text-center">
        {phase === 'sent' ? (
          <span className="text-sm text-slate-500" data-testid="report-thanks">Спасибо, сообщение передано</span>
        ) : (
          <button type="button" className="text-sm text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline" onClick={() => setPhase('open')} data-testid="report-open">
            Сообщить о проблеме
          </button>
        )}
      </div>

      {(phase === 'open' || phase === 'sending') && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="report-title" data-testid="report-dialog">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-5 pb-safe shadow-xl sm:rounded-3xl">
            <h2 id="report-title" className="text-lg font-bold">Сообщить о проблеме</h2>
            <label className="mt-4 block text-sm text-slate-500" htmlFor="report-reason">Причина</label>
            <select id="report-reason" className="input mt-1 w-full" value={reason} onChange={(e) => setReason(e.target.value as ReportReason)} data-testid="report-reason">
              {REPORT_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <label className="mt-3 block text-sm text-slate-500" htmlFor="report-comment">Комментарий{reason === 'other' ? '' : ' (необязательно)'}</label>
            <textarea id="report-comment" className="input mt-1 h-28 w-full resize-none" maxLength={REPORT_COMMENT_MAX} value={comment} onChange={(e) => setComment(e.target.value)} data-testid="report-comment" />
            {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button className="btn btn-primary" onClick={send} disabled={phase === 'sending'} data-testid="report-send">{phase === 'sending' ? 'Отправляем…' : 'Отправить'}</button>
              <button className="btn btn-ghost" onClick={close} disabled={phase === 'sending'}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

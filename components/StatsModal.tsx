'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, ChevronRight } from 'lucide-react';
import { plural } from '@/lib/utils';
import type { Stats } from '@/lib/repo/users';

export default function StatsModal({ stats, readiness }: { stats: Stats; readiness: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition active:scale-[0.98]"
        data-testid="btn-readiness"
      >
        Готовность к экзамену: {readiness}%
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center" onClick={() => setOpen(false)}>
          <div
            className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 pb-8 shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Ваша статистика</h2>
              <button onClick={() => setOpen(false)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Закрыть">
                <X size={20} />
              </button>
            </div>

            <div className="card p-5 text-center">
              <div className="text-4xl font-bold">{readiness}%</div>
              <div className="mt-1 text-sm font-medium text-slate-500">Готовность к экзамену</div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-brand-500" style={{ width: `${readiness}%` }} />
              </div>
              <p className="mt-3 text-xs text-slate-400">Считаем по числу пройденных вопросов и точности ответов</p>
            </div>

            <Link
              href="/errors"
              onClick={() => setOpen(false)}
              className="btn btn-primary mt-4 w-full justify-between text-base"
            >
              История ответов и ошибки <ChevronRight size={18} />
            </Link>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <StatCard value={stats.distinct_questions} label="ПРОЙДЕНО ВОПРОСОВ" sub={`${stats.total_answers} ${plural(stats.total_answers, 'ответ', 'ответа', 'ответов')} с повторами · ${stats.total_correct} верных`} big />

              <div className="grid grid-cols-2 gap-3">
                <StatCard value={`${stats.accuracy_last30}%`} label="ТОЧНОСТЬ" sub="за последние 30 ответов" />
                <StatCard value={stats.errors_resolved} label="ВЫУЧЕНО" sub={`${stats.errors_open} ${plural(stats.errors_open, 'ошибка', 'ошибки', 'ошибок')} ждут закрепления`} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <StatCard value={`${stats.today_answers}/30`} label="СЕГОДНЯ" sub={`${stats.today_correct} верно`} />
                <StatCard value={stats.streak_days} label="СЕРИЯ" sub={`${plural(stats.streak_days, 'день', 'дня', 'дней')} подряд`} />
              </div>
            </div>

            <div className="card mt-3 p-4">
              <div className="mb-3 text-sm font-semibold">Активность за 14 дней</div>
              <Activity14 days={stats.activity_14} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StatCard({ value, label, sub, big }: { value: string | number; label: string; sub: string; big?: boolean }) {
  return (
    <div className="card p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className={big ? 'mt-1 text-3xl font-bold' : 'mt-1 text-2xl font-bold'}>{value}</div>
      <div className="mt-0.5 text-xs text-slate-400">{sub}</div>
    </div>
  );
}

function Activity14({ days }: { days: { date: string; count: number }[] }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  const todayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date());
  return (
    <div>
      <div className="flex h-24 items-end gap-1.5">
        {days.map((d) => {
          const isToday = d.date === todayKey;
          const h = d.count ? Math.max(10, Math.round((d.count / max) * 100)) : 4;
          return (
            <div key={d.date} className="flex flex-1 flex-col items-center justify-end gap-1" title={`${d.date}: ${d.count}`}>
              {d.count > 0 && <span className={`text-[10px] font-semibold ${isToday ? 'text-red-600' : 'text-slate-400'}`}>{d.count}</span>}
              <div
                className={`w-full rounded-t-sm ${isToday ? 'bg-red-400' : 'bg-slate-200'}`}
                style={{ height: `${h}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-slate-400">
        <span>{formatShort(days[0]?.date)}</span>
        <span>сегодня</span>
      </div>
    </div>
  );
}

function formatShort(iso: string | undefined) {
  if (!iso) return '';
  const [, m, d] = iso.split('-');
  return `${d}.${m}`;
}

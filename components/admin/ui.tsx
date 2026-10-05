import Link from 'next/link';
import { ACCESS_LABEL, accessState, qs, type AccessState } from '@/lib/admin-format';

/** Мелкие серверные компоненты админки (без состояния) */

export function Stat({ label, value, href, tone, sub }: { label: string; value: React.ReactNode; href?: string; tone?: 'warn' | 'good' | 'bad'; sub?: React.ReactNode }) {
  const color = tone === 'warn' ? 'text-amber-700' : tone === 'good' ? 'text-green-700' : tone === 'bad' ? 'text-red-700' : 'text-slate-900';
  const body = (
    <div className={`card p-4 ${href ? 'transition hover:shadow-md' : ''}`}>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-400">{sub}</div>}
    </div>
  );
  return href ? <Link href={href} className="block">{body}</Link> : body;
}

/** Столбики за период (без библиотек): title на каждом столбике */
export function Bars({ data, label, format }: { data: { label: string; value: number }[]; label: string; format?: (n: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const f = format ?? ((n: number) => String(n));
  return (
    <figure className="card p-4" aria-label={label}>
      <figcaption className="mb-3 text-sm font-medium text-slate-700">{label}</figcaption>
      <div className="flex h-24 items-end gap-[3px]" role="img" aria-label={`${label}: ${data.map((d) => `${d.label} — ${f(d.value)}`).join(', ')}`}>
        {data.map((d) => (
          <div key={d.label} title={`${d.label}: ${f(d.value)}`} className="flex-1 rounded-t bg-brand-500/70" style={{ height: `${Math.max(d.value ? 4 : 1, (d.value / max) * 100)}%`, opacity: d.value ? 1 : 0.25 }} />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-400"><span>{data[0]?.label}</span><span>{data[data.length - 1]?.label}</span></div>
    </figure>
  );
}

const ACCESS_TONE: Record<AccessState, string> = {
  active: 'bg-green-100 text-green-800',
  expiring: 'bg-amber-100 text-amber-800',
  expired: 'bg-slate-200 text-slate-600',
  never: 'bg-slate-100 text-slate-500',
};

export function AccessBadge({ until }: { until: string | null }) {
  const s = accessState(until);
  return <span className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${ACCESS_TONE[s]}`}>{ACCESS_LABEL[s]}</span>;
}

export function Badge({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'slate' | 'red' | 'blue' | 'green' | 'amber' }) {
  const m = { slate: 'bg-slate-200 text-slate-700', red: 'bg-red-100 text-red-800', blue: 'bg-brand-600/15 text-brand-700', green: 'bg-green-100 text-green-800', amber: 'bg-amber-100 text-amber-800' }[tone];
  return <span className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${m}`}>{children}</span>;
}

/** Пагинация ссылками; params — текущие фильтры */
export function Pager({ base, params, page, perPage, total }: { base: string; params: Record<string, string | number | undefined>; page: number; perPage: number; total: number }) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (pages <= 1) return <div className="mt-3 text-xs text-slate-400">Всего: {total}</div>;
  const link = (p: number, text: string, off?: boolean) =>
    off ? <span className="btn btn-ghost btn-sm pointer-events-none opacity-40">{text}</span> : <Link className="btn btn-ghost btn-sm" href={`${base}${qs({ ...params, page: p === 1 ? undefined : p })}`}>{text}</Link>;
  return (
    <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
      {link(page - 1, '← Назад', page <= 1)}
      <span>Стр. {page} из {pages} · всего {total}</span>
      {link(page + 1, 'Вперёд →', page >= pages)}
    </div>
  );
}

export function UserLink({ id, name, username }: { id: string; name: string | null; username?: string | null }) {
  return (
    <Link href={`/admin/users/${id}`} className="font-medium text-brand-700 hover:underline">
      {name || (username ? `@${username}` : 'без имени')}
    </Link>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="p-8 text-center text-sm text-slate-500">{children}</div>;
}

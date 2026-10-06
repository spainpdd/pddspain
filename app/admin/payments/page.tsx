import Link from 'next/link';
import { listPayments, paymentsOverview, PAYMENT_FILTERS } from '@/lib/repo/admin-stats';
import { formatDateTime, formatMoneyCode, formatRub, qs } from '@/lib/admin-format';
import { Badge, Bars, Empty, Pager, Stat, UserLink } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

const LABELS: Record<string, string> = { all: 'Все', live: 'Боевые оплаченные', test: 'Тестовые', pending: 'Ждут оплаты' };

export default async function AdminPayments({ searchParams }: { searchParams: { filter?: string; page?: string; user?: string } }) {
  const filter = (PAYMENT_FILTERS as readonly string[]).includes(searchParams.filter ?? '') ? searchParams.filter! : 'all';
  const page = Math.max(1, Number(searchParams.page) || 1);
  const user = searchParams.user;
  const [o, list] = await Promise.all([paymentsOverview(), listPayments({ filter, page, user })]);
  const base = { filter: filter === 'all' ? '' : filter, user };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Платежи и выручка</h1>
          <p className="mt-1 text-sm text-slate-500">В выручке учитываются только боевые оплаченные счета. Тестовые платежи Prodamus показаны отдельно и в суммы не входят.</p>
        </div>
        <a href={`/api/admin/payments/export${qs({ filter: base.filter })}`} className="btn btn-ghost btn-sm">Скачать CSV</a>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Выручка за всё время" value={formatRub(o.rub.total)} sub={`оплат: ${o.paid_count} · покупателей: ${o.buyers}`} />
        <Stat label="За 30 дней" value={formatRub(o.rub.d30)} />
        <Stat label="За 7 дней" value={formatRub(o.rub.d7)} sub={`сегодня: ${formatRub(o.rub.today)}`} />
        <Stat label="Средний чек" value={formatRub(o.avg_check_rub)} />
        <Stat label="Ждут оплаты" value={o.pending_count} href="/admin/payments?filter=pending" />
        <Stat label="Тестовых оплат" value={o.test_paid_count} href="/admin/payments?filter=test" />
        {o.eur_total > 0 && <Stat label="Старые платежи Stripe" value={`${o.eur_total.toLocaleString('ru-RU')} €`} />}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Bars label="Выручка по дням (30 дней)" data={o.daily.map((d) => ({ label: d.d.slice(5), value: d.sum }))} format={formatRub} />
        <Bars label="Выручка по месяцам (12 месяцев)" data={o.monthly.map((d) => ({ label: d.m, value: d.sum }))} format={formatRub} />
      </div>

      <nav className="flex flex-wrap gap-1.5" aria-label="Фильтры платежей">
        {PAYMENT_FILTERS.map((f) => (
          <Link key={f} href={`/admin/payments${qs({ ...base, filter: f === 'all' ? '' : f })}`}
            className={`chip border ${filter === f ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 text-slate-600 hover:bg-slate-100'}`}>{LABELS[f]}</Link>
        ))}
        {user && <Link href={`/admin/payments${qs({ filter: base.filter })}`} className="chip border border-slate-300 text-slate-600 hover:bg-slate-100">Один пользователь ✕</Link>}
      </nav>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs text-slate-500">
            <tr><th className="p-3">Счёт</th><th className="p-3">Пользователь</th><th className="p-3">Сумма</th><th className="p-3">Показано</th><th className="p-3">Статус</th><th className="p-3">Дней</th><th className="p-3">Создан</th><th className="p-3">Оплачен</th></tr>
          </thead>
          <tbody>
            {list.rows.map((p) => (
              <tr key={`${p.src}-${p.ref}`} className="border-b border-slate-200/60 hover:bg-slate-50">
                <td className="p-3">{p.src === 'prodamus' ? `№${p.ref}` : 'Другое'}{p.is_test && <span className="ml-1"><Badge tone="amber">тест</Badge></span>}</td>
                <td className="p-3"><UserLink id={p.user_id} name={p.user_name} username={p.telegram_username} /></td>
                <td className="p-3 font-medium">{formatMoneyCode(p.amount, p.currency)}{p.fee ? <span className="block text-xs font-normal text-slate-400">комиссия {formatMoneyCode(p.fee, p.currency)}</span> : null}</td>
                <td className="p-3 text-slate-500">{p.shown_currency && p.shown_amount != null && p.shown_currency !== p.currency ? formatMoneyCode(p.shown_amount, p.shown_currency) : '—'}</td>
                <td className="p-3">{p.status === 'paid' ? <Badge tone="green">оплачен</Badge> : <Badge>ждёт оплаты</Badge>}</td>
                <td className="p-3">{p.days_granted ?? '—'}</td>
                <td className="p-3 text-xs text-slate-500">{formatDateTime(p.created_at)}</td>
                <td className="p-3 text-xs text-slate-500">{formatDateTime(p.paid_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.rows.length && <Empty>Платежей по этому фильтру нет</Empty>}
      </div>
      <Pager base="/admin/payments" params={base} page={list.page} perPage={list.perPage} total={list.total} />
    </div>
  );
}

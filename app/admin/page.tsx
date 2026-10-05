import Link from 'next/link';
import { adminOverview, paymentsOverview } from '@/lib/repo/admin-stats';
import { listAudit, AUDIT_ACTIONS } from '@/lib/repo/admin-users';
import { env } from '@/lib/env';
import { formatDateOnly, formatDateTime, formatRub, timeAgo } from '@/lib/admin-format';
import { AccessBadge, Bars, Stat, UserLink } from '@/components/admin/ui';

export default async function AdminHome() {
  const [o, pay, audit] = await Promise.all([adminOverview(), paymentsOverview(), listAudit({ perPage: 8 })]);
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Обзор</h1>

      <section aria-labelledby="h-users">
        <h2 id="h-users" className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Пользователи</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Всего пользователей" value={o.users} href="/admin/users" sub={`+${o.new7} за 7 дн. · +${o.new30} за 30 дн.`} />
          <Stat label="С активным доступом" value={o.active_access} href="/admin/users?filter=active" tone="good" />
          <Stat label="Доступ кончается за 7 дней" value={o.expiring7} href="/admin/users?filter=expiring&sort=access_until&dir=asc" tone={o.expiring7 ? 'warn' : undefined} />
          <Stat label="Заблокировано" value={o.blocked} href="/admin/users?filter=blocked" tone={o.blocked ? 'bad' : undefined} sub={`админов: ${o.admins}`} />
          <Stat label="Активны сегодня (24 ч)" value={o.dau} href="/admin/users?sort=last_seen_at" />
          <Stat label="Активны за 7 дней" value={o.wau} />
          <Stat label="Активны за 30 дней" value={o.mau} />
          <Stat label="Всего ответов" value={o.answers_total.toLocaleString('ru-RU')} />
        </div>
      </section>

      <section aria-labelledby="h-money">
        <h2 id="h-money" className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Деньги <span className="font-normal normal-case text-slate-400">(без тестовых платежей)</span></h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Выручка за всё время" value={formatRub(pay.rub.total)} href="/admin/payments?filter=live" sub={`оплат: ${pay.paid_count} · покупателей: ${pay.buyers}`} />
          <Stat label="За 30 дней" value={formatRub(pay.rub.d30)} href="/admin/payments?filter=live" />
          <Stat label="За 7 дней" value={formatRub(pay.rub.d7)} href="/admin/payments?filter=live" sub={`сегодня: ${formatRub(pay.rub.today)}`} />
          <Stat label="Средний чек" value={formatRub(pay.avg_check_rub)} href="/admin/payments" sub={pay.pending_count ? `неоплаченных счетов: ${pay.pending_count}` : undefined} />
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3" aria-label="Динамика за 30 дней">
        <Bars label="Регистрации по дням" data={o.signups_daily.map((d) => ({ label: d.d.slice(5), value: d.n }))} />
        <Bars label="Ответы по дням" data={o.answers_daily.map((d) => ({ label: d.d.slice(5), value: d.n }))} />
        <Bars label="Выручка по дням" data={pay.daily.map((d) => ({ label: d.d.slice(5), value: d.sum }))} format={formatRub} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="font-semibold">Новые пользователи</h2>
            <Link href="/admin/users" className="text-sm text-brand-700 hover:underline">Все →</Link>
          </div>
          <ul className="divide-y divide-slate-200/70 text-sm">
            {o.recent_users.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0"><UserLink id={u.id} name={u.display_name} username={u.telegram_username} /><div className="text-xs text-slate-400">{formatDateTime(u.created_at)}</div></div>
                <AccessBadge until={u.access_until} />
              </li>
            ))}
            {!o.recent_users.length && <li className="p-4 text-slate-500">Пока никого</li>}
          </ul>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="font-semibold">Скоро закончится доступ</h2>
            <Link href="/admin/users?filter=expiring&sort=access_until&dir=asc" className="text-sm text-brand-700 hover:underline">Все →</Link>
          </div>
          <ul className="divide-y divide-slate-200/70 text-sm">
            {o.expiring.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <UserLink id={u.id} name={u.display_name} username={u.telegram_username} />
                <span className="text-xs text-slate-500">до {formatDateOnly(u.access_until)}</span>
              </li>
            ))}
            {!o.expiring.length && <li className="p-4 text-slate-500">В ближайшие 14 дней ни у кого</li>}
          </ul>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold">Последние действия администраторов</h2>
          <Link href="/admin/audit" className="text-sm text-brand-700 hover:underline">Весь журнал →</Link>
        </div>
        <ul className="divide-y divide-slate-200/70 text-sm">
          {audit.rows.map((a) => (
            <li key={a.id} className="px-4 py-2.5">
              <span className="font-medium">{a.admin_name ?? '—'}</span> · {AUDIT_ACTIONS[a.action] ?? a.action}
              {a.target_user_id && <> → <Link href={`/admin/users/${a.target_user_id}`} className="text-brand-700 hover:underline">{a.target_name ?? 'пользователь'}</Link></>}
              <span className="ml-2 text-xs text-slate-400">{timeAgo(a.created_at)}</span>
            </li>
          ))}
          {!audit.rows.length && <li className="p-4 text-slate-500">Действий пока нет</li>}
        </ul>
      </section>

      <section aria-labelledby="h-content">
        <h2 id="h-content" className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Контент</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Вопросов" value={o.questions} href="/admin/questions" />
          <Stat label="Права не подтверждены" value={o.unverified} href="/admin/questions?rights=unverified" tone={o.unverified ? 'warn' : undefined} />
          <Stat label="Нет перевода RU" value={o.no_ru} href="/admin/questions?missing=ru" />
          <Stat label="Нет перевода HY" value={o.no_hy} href="/admin/questions?missing=hy" />
          <Stat label="Тестов" value={o.tests} href="/admin/tests" />
          <Stat label="Заявок по гарантии «не сдал»" value={o.open_claims} href="/admin/claims" />
          <Stat label="Новых сообщений о проблемах" value={o.new_reports} href="/admin/reports" tone={o.new_reports ? 'warn' : undefined} />
        </div>
        <div className="card mt-4 p-4 text-sm text-slate-500">
          <p>Пользователям показываются вопросы: активные и со статусом прав <b>own / dgt_official / licensed</b>{env.serveUnverified ? <> и <b className="text-red-700">unverified</b> (включён переключатель)</> : ''}.</p>
          <p className="mt-2">Как менять вопросы постепенно: <Link href="/admin/questions" className="text-brand-700 underline">Вопросы</Link> → откройте нужный → правьте формулировку, варианты, перевод, картинку. Изменения сразу видны в тестах.</p>
        </div>
      </section>
    </div>
  );
}

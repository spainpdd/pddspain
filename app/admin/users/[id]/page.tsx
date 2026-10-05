import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getUserDetail, listAllTags, AUDIT_ACTIONS } from '@/lib/repo/admin-users';
import { requireAdmin } from '@/lib/auth';
import { accessState, formatDateOnly, formatDateTime, formatMoneyCode, timeAgo, userLabel } from '@/lib/admin-format';
import { AccessBadge, Badge, Bars, Empty, Stat } from '@/components/admin/ui';
import { AccessPanel, AccountPanel, NotesPanel, TagsEditor } from '@/components/admin/UserPanels';

export const dynamic = 'force-dynamic';

const CONTEXT: Record<string, string> = { test: 'тест', review: 'разбор', errors: 'ошибки', daily: 'вопрос дня' };

function auditText(action: string, d: Record<string, any>): string {
  switch (action) {
    case 'grant_days': return `${d.days > 0 ? '+' : ''}${d.days} дн. → до ${formatDateOnly(d.after)}${d.reason ? ` («${d.reason}»)` : ''}`;
    case 'set_access_until': return `до ${formatDateOnly(d.after)}${d.reason ? ` («${d.reason}»)` : ''}`;
    case 'end_access': return d.reason ? `«${d.reason}»` : '';
    case 'set_admin': return d.on ? 'выдано' : 'снято';
    case 'block': case 'unblock': return d.reason ? `«${d.reason}»` : '';
    case 'set_tags': return (d.tags ?? []).join(', ') || 'теги очищены';
    case 'note_add': return d.preview ?? '';
    default: return '';
  }
}

export default async function UserCard({ params }: { params: { id: string } }) {
  const me = await requireAdmin();
  const [d, known] = await Promise.all([getUserDetail(params.id), listAllTags()]);
  if (!d) notFound();
  const u = d.user;
  const state = accessState(u.access_until);
  const hasPaymentRows = d.payments.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/users" className="text-sm text-slate-500 hover:text-slate-700">← Пользователи</Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{userLabel(u)}</h1>
          <AccessBadge until={u.access_until} />
          {u.is_admin && <Badge tone="blue">админ</Badge>}
          {u.blocked_at && <Badge tone="red">заблокирован</Badge>}
          {u.tags.map((t) => <Link key={t} href={`/admin/users?tag=${encodeURIComponent(t)}`}><Badge>{t}</Badge></Link>)}
        </div>
        <dl className="mt-2 grid gap-x-8 gap-y-1 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
          <div><dt className="inline text-slate-400">Telegram: </dt><dd className="inline">{u.telegram_username ? <a className="text-brand-700 hover:underline" href={`https://t.me/${u.telegram_username}`} target="_blank" rel="noreferrer">@{u.telegram_username}</a> : '—'} · ID {u.telegram_id}</dd></div>
          <div><dt className="inline text-slate-400">Регистрация: </dt><dd className="inline">{formatDateTime(u.created_at)}</dd></div>
          <div><dt className="inline text-slate-400">Последний визит: </dt><dd className="inline">{timeAgo(u.last_seen_at)}</dd></div>
          <div><dt className="inline text-slate-400">Доступ до: </dt><dd className="inline">{u.access_until ? formatDateTime(u.access_until) : '—'}</dd></div>
          <div><dt className="inline text-slate-400">Язык теста / перевод: </dt><dd className="inline">{u.study_lang.toUpperCase()} / {u.trans_lang.toUpperCase()}{u.auto_translate ? ' (авто)' : ''}</dd></div>
          <div><dt className="inline text-slate-400">Рассылка: </dt><dd className="inline">{u.notify ? 'включена' : 'выключена'}</dd></div>
          <div><dt className="inline text-slate-400">Гарантия: </dt><dd className="inline">{u.exam_passed_at ? `сдал(а) ${formatDateOnly(u.exam_passed_at)}` : u.guarantee_eligible ? 'действует' : 'нет'}</dd></div>
          <div className="sm:col-span-2 lg:col-span-3"><dt className="inline text-slate-400">ID профиля: </dt><dd className="inline font-mono text-xs">{u.id}</dd></div>
        </dl>
        {u.blocked_at && <p className="mt-2 rounded-xl bg-red-50 p-3 text-sm text-red-800">Заблокирован {formatDateTime(u.blocked_at)}{u.blocked_reason ? `: ${u.blocked_reason}` : ''}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        <Stat label="Ответов" value={d.stats.answers} />
        <Stat label="Точность" value={d.stats.answers ? `${d.stats.accuracy}%` : '—'} />
        <Stat label="Тестов сдано" value={d.stats.tests_passed} />
        <Stat label="Ошибок открыто" value={d.stats.errors_open} tone={d.stats.errors_open ? 'warn' : undefined} />
        <Stat label="Ошибок исправлено" value={d.stats.errors_resolved} />
        <Stat label="Первый ответ" value={<span className="text-lg">{formatDateOnly(d.stats.first_answer_at)}</span>} sub={d.stats.last_answer_at ? `последний ${timeAgo(d.stats.last_answer_at)}` : undefined} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AccessPanel userId={u.id} until={u.access_until} />
        <div className="space-y-4">
          <AccountPanel userId={u.id} isAdmin={u.is_admin} blocked={!!u.blocked_at} blockedReason={u.blocked_reason} isSelf={u.id === me.id} />
          <TagsEditor userId={u.id} tags={u.tags} known={known.map((k) => k.tag)} />
        </div>
      </div>

      <Bars label="Ответы по дням (30 дней)" data={d.daily.map((x) => ({ label: x.d.slice(5), value: x.n }))} />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card overflow-hidden">
          <h2 className="border-b border-slate-200 px-4 py-3 font-semibold">Платежи</h2>
          {d.invoices.length > 0 || hasPaymentRows ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-slate-500"><tr><th className="p-3">Счёт</th><th className="p-3">Сумма</th><th className="p-3">Статус</th><th className="p-3">Дата</th></tr></thead>
                <tbody>
                  {d.invoices.map((i) => (
                    <tr key={i.inv_id} className="border-t border-slate-200/60">
                      <td className="p-3">№{i.inv_id}{i.is_test && <span className="ml-1"><Badge tone="amber">тест</Badge></span>}</td>
                      <td className="p-3">{formatMoneyCode(i.out_sum, 'RUB')}{i.shown_currency && i.shown_currency !== 'RUB' && <span className="block text-xs text-slate-400">показано {formatMoneyCode(i.shown_amount ?? 0, i.shown_currency)}</span>}</td>
                      <td className="p-3">{i.status === 'paid' ? <Badge tone="green">оплачен</Badge> : <Badge>ждёт оплаты</Badge>}</td>
                      <td className="p-3 text-xs text-slate-500">{formatDateTime(i.paid_at ?? i.created_at)}</td>
                    </tr>
                  ))}
                  {d.payments.filter((p) => !p.ref.startsWith('rk:')).map((p) => (
                    <tr key={p.id} className="border-t border-slate-200/60">
                      <td className="p-3">Stripe</td><td className="p-3">{formatMoneyCode(p.amount_cents / 100, p.currency.toUpperCase())}</td>
                      <td className="p-3"><Badge tone="green">оплачен</Badge></td><td className="p-3 text-xs text-slate-500">{formatDateTime(p.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="border-t border-slate-200/60 px-4 py-2 text-xs text-slate-400">Выдано по оплатам: {d.payments.reduce((s, p) => s + p.days_granted, 0)} дн. · Все платежи: <Link className="text-brand-700 hover:underline" href={`/admin/payments?user=${u.id}`}>открыть</Link></p>
            </div>
          ) : <Empty>Платежей не было{state === 'never' ? '' : ' (доступ выдан вручную или по гарантии)'}</Empty>}
        </section>

        <section className="card overflow-hidden">
          <h2 className="border-b border-slate-200 px-4 py-3 font-semibold">Заявки по гарантии</h2>
          {d.claims.length ? (
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-500"><tr><th className="p-3">Экзамен</th><th className="p-3">Результат</th><th className="p-3">Дней</th><th className="p-3">Подана</th></tr></thead>
              <tbody>
                {d.claims.map((c) => (
                  <tr key={c.id} className={`border-t border-slate-200/60 ${c.revoked ? 'line-through opacity-50' : ''}`}>
                    <td className="p-3">{formatDateOnly(c.exam_date + 'T12:00:00Z')}</td><td className="p-3">{c.result === 'passed' ? 'сдал(а)' : 'не сдал(а)'}</td>
                    <td className="p-3">{c.days_added}</td><td className="p-3 text-xs text-slate-500">{formatDateOnly(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <Empty>Заявок нет</Empty>}
        </section>
      </div>

      <section className="card overflow-hidden">
        <h2 className="border-b border-slate-200 px-4 py-3 font-semibold">Прохождение тестов <span className="text-sm font-normal text-slate-400">({d.progress.length})</span></h2>
        {d.progress.length ? (
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-white text-xs text-slate-500"><tr><th className="p-3">Тест</th><th className="p-3">Попыток</th><th className="p-3">Лучший (ошибок)</th><th className="p-3">Последний</th><th className="p-3">Статус</th><th className="p-3">Когда</th></tr></thead>
              <tbody>
                {d.progress.map((t) => (
                  <tr key={`${t.category}-${t.number}`} className="border-t border-slate-200/60">
                    <td className="p-3"><Link className="text-brand-700 hover:underline" href={`/admin/tests/${t.category}/${t.number}`}>{t.category === 'official' ? 'Официальный' : 'Доп.'} №{t.number}</Link></td>
                    <td className="p-3">{t.attempts}</td><td className="p-3">{t.best_errors ?? '—'}</td><td className="p-3">{t.last_errors ?? '—'}</td>
                    <td className="p-3">{t.passed ? <Badge tone="green">сдан</Badge> : <Badge>не сдан</Badge>}</td>
                    <td className="p-3 text-xs text-slate-500">{timeAgo(t.last_attempt_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty>Тесты ещё не проходил(а)</Empty>}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card overflow-hidden">
          <h2 className="border-b border-slate-200 px-4 py-3 font-semibold">Последние ответы</h2>
          {d.recent.length ? (
            <ul className="divide-y divide-slate-200/60 text-sm">
              {d.recent.map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-3 px-4 py-2">
                  <span>
                    <span className={a.correct ? 'text-green-700' : 'text-red-700'}>{a.correct ? '✓' : '✗'}</span>{' '}
                    <Link className="text-brand-700 hover:underline" href={`/admin/questions/${a.question_id}`}>вопрос</Link>
                    <span className="text-xs text-slate-400"> · {a.topic ?? 'без темы'} · {CONTEXT[a.context] ?? a.context} · ответ {a.chosen.toUpperCase()}</span>
                  </span>
                  <span className="text-xs text-slate-400">{timeAgo(a.created_at)}</span>
                </li>
              ))}
            </ul>
          ) : <Empty>Ответов пока нет</Empty>}
        </section>
        <NotesPanel userId={u.id} notes={d.notes} />
      </div>

      <section className="card overflow-hidden">
        <h2 className="border-b border-slate-200 px-4 py-3 font-semibold">Журнал действий по этому пользователю</h2>
        {d.audit.length ? (
          <ul className="divide-y divide-slate-200/60 text-sm">
            {d.audit.map((a) => (
              <li key={a.id} className="px-4 py-2.5">
                <span className="font-medium">{AUDIT_ACTIONS[a.action] ?? a.action}</span> <span className="text-slate-600">{auditText(a.action, a.details as any)}</span>
                <div className="text-xs text-slate-400">{a.admin_name ?? '—'} · {formatDateTime(a.created_at)}</div>
              </li>
            ))}
          </ul>
        ) : <Empty>Ручных действий не было</Empty>}
      </section>
    </div>
  );
}

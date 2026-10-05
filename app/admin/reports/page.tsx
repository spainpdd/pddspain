import Link from 'next/link';
import { listReports } from '@/lib/repo/reports';
import { REPORT_REASONS, REPORT_REASON_LABEL } from '@/lib/reports';
import ReportActions from '@/components/admin/ReportActions';
import { Badge, Pager } from '@/components/admin/ui';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const STATUS_TABS = [
  ['new', 'Новые'],
  ['resolved', 'Решённые'],
  ['', 'Все'],
] as const;

export default async function AdminReports({ searchParams }: { searchParams: { status?: string; reason?: string; page?: string } }) {
  const status = searchParams.status === undefined ? 'new' : searchParams.status;
  const reason = searchParams.reason ?? '';
  const r = await listReports({ status, reason, page: Number(searchParams.page) || 1 });
  const link = (s: string, extra: Record<string, string> = {}) => {
    const q = new URLSearchParams({ status: s, ...(reason ? { reason } : {}), ...extra });
    return `/admin/reports?${q.toString()}`;
  };

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Сообщения о проблемах</h1>
      <p className="mb-4 text-sm text-slate-400">Пользователи пишут из вопроса, под пояснением. Откройте вопрос, исправьте и отметьте «Решено».</p>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {STATUS_TABS.map(([s, label]) => (
          <Link key={s} href={link(s)} className={`rounded-lg px-3 py-1.5 text-sm ${status === s ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{label}</Link>
        ))}
        <form action="/admin/reports" className="ml-auto flex gap-2">
          <input type="hidden" name="status" value={status} />
          <select name="reason" defaultValue={reason} className="input text-sm">
            <option value="">Любая причина</option>
            {REPORT_REASONS.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
          </select>
          <button className="btn btn-ghost btn-sm">Показать</button>
        </form>
      </div>

      <div className="space-y-3" data-testid="reports-list">
        {r.rows.map((x) => (
          <article key={x.id} className={`card p-4 ${x.status === 'resolved' ? 'opacity-70' : ''}`}>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge tone={x.reason === 'wrong_answer' ? 'red' : 'amber'}>{REPORT_REASON_LABEL[x.reason] ?? x.reason}</Badge>
              {x.status === 'resolved' && <Badge tone="green">Решено</Badge>}
              {x.lang && <Badge>{x.lang.toUpperCase()}</Badge>}
              {x.same_question > 1 && <Badge tone="blue">по этому вопросу: {x.same_question}</Badge>}
              <span className="ml-auto text-xs text-slate-400">{formatDate(x.created_at)}</span>
            </div>
            <p className="mt-2 text-sm text-slate-800">{x.question_text ?? '(текст вопроса недоступен)'}</p>
            {x.comment && <p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-100 p-3 text-sm text-slate-700" data-testid="report-comment-text">{x.comment}</p>}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <Link href={`/admin/users/${x.user_id}`} className="text-brand-700 hover:underline">{x.user_name ?? 'Пользователь'}{x.telegram_username ? ` (@${x.telegram_username})` : ''}</Link>
              <Link href={`/admin/questions/${x.question_id}`} className="text-brand-700 hover:underline">Открыть вопрос →</Link>
            </div>
            <ReportActions id={x.id} status={x.status} note={x.admin_note} />
          </article>
        ))}
        {r.rows.length === 0 && <div className="card p-8 text-center text-slate-500">{status === 'new' ? 'Новых сообщений нет' : 'Пока пусто'}</div>}
      </div>
      <Pager base="/admin/reports" params={{ status, reason: reason || undefined }} page={r.page} perPage={r.perPage} total={r.total} />
    </div>
  );
}

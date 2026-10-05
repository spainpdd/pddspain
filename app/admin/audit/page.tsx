import Link from 'next/link';
import { AUDIT_ACTIONS, listAudit, listAuditAdmins } from '@/lib/repo/admin-users';
import { formatDateOnly, formatDateTime, qs } from '@/lib/admin-format';
import { Empty, Pager } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

function detailText(action: string, d: Record<string, any>): string {
  switch (action) {
    case 'grant_days': return `${d.days > 0 ? '+' : ''}${d.days} дн. → доступ до ${formatDateOnly(d.after)}${d.reason ? ` · «${d.reason}»` : ''}`;
    case 'set_access_until': return `доступ до ${formatDateOnly(d.after)}${d.reason ? ` · «${d.reason}»` : ''}`;
    case 'end_access': return `было до ${formatDateOnly(d.before)}${d.reason ? ` · «${d.reason}»` : ''}`;
    case 'set_admin': return d.on ? 'выдано' : 'снято';
    case 'block': case 'unblock': return d.reason ? `«${d.reason}»` : '';
    case 'set_tags': return (d.tags ?? []).join(', ') || 'очищены';
    case 'note_add': return d.preview ?? '';
    default: return '';
  }
}

export default async function AuditPage({ searchParams }: { searchParams: { action?: string; admin?: string; user?: string; page?: string } }) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const [r, admins] = await Promise.all([
    listAudit({ action: searchParams.action, admin: searchParams.admin, user: searchParams.user, page }),
    listAuditAdmins(),
  ]);
  const base = { action: searchParams.action, admin: searchParams.admin, user: searchParams.user };
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Журнал действий</h1>
      <p className="mb-4 text-sm text-slate-500">Кто, когда и что менял в админке: выдача доступа, права, блокировки, теги, заметки.</p>
      <form className="mb-4 flex flex-wrap gap-2" action="/admin/audit">
        <select name="action" defaultValue={searchParams.action ?? ''} className="input !w-auto" aria-label="Действие">
          <option value="">Все действия</option>
          {Object.entries(AUDIT_ACTIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select name="admin" defaultValue={searchParams.admin ?? ''} className="input !w-auto" aria-label="Администратор">
          <option value="">Все администраторы</option>
          {admins.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        {searchParams.user && <input type="hidden" name="user" value={searchParams.user} />}
        <button className="btn btn-primary btn-sm">Показать</button>
        {(searchParams.action || searchParams.admin || searchParams.user) && <Link href="/admin/audit" className="btn btn-ghost btn-sm">Сбросить</Link>}
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs text-slate-500"><tr><th className="p-3">Когда</th><th className="p-3">Администратор</th><th className="p-3">Действие</th><th className="p-3">Пользователь</th><th className="p-3">Подробности</th></tr></thead>
          <tbody>
            {r.rows.map((a) => (
              <tr key={a.id} className="border-b border-slate-200/60">
                <td className="p-3 text-xs text-slate-500">{formatDateTime(a.created_at)}</td>
                <td className="p-3">{a.admin_name ?? '—'}</td>
                <td className="p-3">{AUDIT_ACTIONS[a.action] ?? a.action}</td>
                <td className="p-3">{a.target_user_id ? <Link href={`/admin/users/${a.target_user_id}`} className="text-brand-700 hover:underline">{a.target_name ?? 'пользователь'}</Link> : (a.target_name ?? '—')}</td>
                <td className="p-3 text-slate-600">{detailText(a.action, a.details as any)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!r.rows.length && <Empty>Записей нет</Empty>}
      </div>
      <Pager base="/admin/audit" params={base} page={r.page} perPage={r.perPage} total={r.total} />
    </div>
  );
}

import { listUsers } from '@/lib/repo/admin';
import { GrantDays } from '@/components/admin/SmallForms';
import { formatDate } from '@/lib/utils';
import { hasPaidAccess } from '@/lib/engine';

export default async function AdminUsers({ searchParams }: { searchParams: { q?: string } }) {
  const users = await listUsers(searchParams.q?.trim() ?? '');
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Пользователи <span className="text-base font-normal text-slate-500">({users.length})</span></h1>
      <form className="mb-4"><input name="q" defaultValue={searchParams.q} placeholder="Имя, @username или Telegram ID" className="input max-w-sm" /></form>
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-800 text-xs text-slate-500">
            <tr><th className="p-3">Пользователь</th><th className="p-3">Доступ до</th><th className="p-3">Ответов</th><th className="p-3">Тестов</th><th className="p-3">Ошибок</th><th className="p-3">Регистрация</th><th className="p-3">Дни</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-800/60" data-testid="user-row">
                <td className="p-3">
                  <div className="font-medium">{u.display_name}{u.is_admin && <span className="ml-2 rounded bg-brand-600/30 px-1.5 text-[10px] text-brand-400">admin</span>}</div>
                  <div className="text-xs text-slate-500">{u.telegram_username ? `@${u.telegram_username} · ` : ''}{u.telegram_id}{!u.notify && ' · без рассылки'}</div>
                </td>
                <td className={hasPaidAccess(u.access_until) ? 'p-3 text-green-300' : 'p-3 text-slate-500'}>{formatDate(u.access_until)}</td>
                <td className="p-3">{u.answers}</td><td className="p-3">{u.tests_passed}</td><td className="p-3">{u.errors_open}</td>
                <td className="p-3 text-xs text-slate-500">{formatDate(u.created_at)}</td>
                <td className="p-3"><GrantDays userId={u.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

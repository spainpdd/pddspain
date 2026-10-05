import Link from 'next/link';
import { listAllTags, listUsersAdmin, USER_FILTERS, USER_SORTS } from '@/lib/repo/admin-users';
import { formatDateOnly, qs, timeAgo, userLabel } from '@/lib/admin-format';
import { AccessBadge, Badge, Empty, Pager } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

const FILTER_LABELS: Record<string, string> = {
  all: 'Все', active: 'С доступом', expiring: 'Кончается ≤ 7 дн.', expired: 'Доступ закончился', never: 'Без доступа', paid: 'Платили', admin: 'Админы', blocked: 'Заблокированные',
};

type SP = { q?: string; filter?: string; tag?: string; sort?: string; dir?: string; page?: string };

export default async function AdminUsers({ searchParams }: { searchParams: SP }) {
  const filter = (USER_FILTERS as readonly string[]).includes(searchParams.filter ?? '') ? searchParams.filter! : 'all';
  const sort = (USER_SORTS as readonly string[]).includes(searchParams.sort ?? '') ? searchParams.sort! : 'created_at';
  const dir = searchParams.dir === 'asc' ? 'asc' : 'desc';
  const page = Math.max(1, Number(searchParams.page) || 1);
  const q = searchParams.q?.trim() ?? '';
  const tag = searchParams.tag?.trim() ?? '';
  const [{ rows, total, perPage }, tags] = await Promise.all([
    listUsersAdmin({ q, filter, tag, sort, dir, page }),
    listAllTags(),
  ]);
  const base = { q, filter: filter === 'all' ? '' : filter, tag, sort: sort === 'created_at' ? '' : sort, dir: dir === 'desc' ? '' : dir };

  const th = (key: string, title: string) => {
    const active = sort === key;
    const nextDir = active && dir === 'desc' ? 'asc' : 'desc';
    return (
      <th className="p-3" aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
        <Link href={`/admin/users${qs({ ...base, sort: key === 'created_at' && nextDir === 'desc' ? '' : key, dir: nextDir === 'desc' ? '' : nextDir })}`} className="hover:text-slate-800">
          {title}{active ? (dir === 'asc' ? ' ↑' : ' ↓') : ''}
        </Link>
      </th>
    );
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold">Пользователи <span className="text-base font-normal text-slate-500">({total})</span></h1>
        <a href={`/api/admin/users/export${qs({ q, filter: base.filter, tag, sort: base.sort, dir: base.dir })}`} className="btn btn-ghost btn-sm">Скачать CSV</a>
      </div>

      <form className="mb-3 flex flex-wrap gap-2" action="/admin/users">
        <input name="q" defaultValue={q} placeholder="Имя, @username, Telegram ID или ID профиля" className="input max-w-sm" aria-label="Поиск" />
        {filter !== 'all' && <input type="hidden" name="filter" value={filter} />}
        {sort !== 'created_at' && <input type="hidden" name="sort" value={sort} />}
        {dir === 'asc' && <input type="hidden" name="dir" value="asc" />}
        <select name="tag" defaultValue={tag} className="input !w-auto" aria-label="Тег">
          <option value="">Все теги</option>
          {tags.map((t) => <option key={t.tag} value={t.tag}>{t.tag} ({t.n})</option>)}
        </select>
        <button className="btn btn-primary btn-sm">Найти</button>
        {(q || tag) && <Link href={`/admin/users${qs({ filter: base.filter })}`} className="btn btn-ghost btn-sm">Сбросить</Link>}
      </form>

      <nav className="mb-4 flex flex-wrap gap-1.5" aria-label="Фильтры">
        {USER_FILTERS.map((f) => (
          <Link key={f} href={`/admin/users${qs({ ...base, filter: f === 'all' ? '' : f })}`}
            className={`chip border ${filter === f ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 text-slate-600 hover:bg-slate-100'}`}>
            {FILTER_LABELS[f]}
          </Link>
        ))}
      </nav>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs text-slate-500">
            <tr>
              {th('name', 'Пользователь')}{th('access_until', 'Доступ')}{th('last_seen_at', 'Визит')}{th('answers', 'Ответов')}
              <th className="p-3">Тестов</th><th className="p-3">Ошибок</th><th className="p-3">Оплат</th>{th('created_at', 'Регистрация')}
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className={`border-b border-slate-200/60 hover:bg-slate-50 ${u.blocked_at ? 'bg-red-50/50' : ''}`} data-testid="user-row">
                <td className="p-3">
                  <Link href={`/admin/users/${u.id}`} className="font-medium text-brand-700 hover:underline">{userLabel(u)}</Link>
                  {u.is_admin && <span className="ml-2"><Badge tone="blue">админ</Badge></span>}
                  {u.blocked_at && <span className="ml-2"><Badge tone="red">заблокирован</Badge></span>}
                  <div className="text-xs text-slate-500">{u.telegram_username ? `@${u.telegram_username} · ` : ''}{u.telegram_id}{!u.notify && ' · без рассылки'}</div>
                  {u.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {u.tags.map((t) => <Link key={t} href={`/admin/users${qs({ ...base, tag: t })}`}><Badge>{t}</Badge></Link>)}
                    </div>
                  )}
                </td>
                <td className="p-3"><AccessBadge until={u.access_until} /><div className="mt-0.5 text-xs text-slate-500">{u.access_until ? `до ${formatDateOnly(u.access_until)}` : ''}</div></td>
                <td className="p-3 text-xs text-slate-500">{timeAgo(u.last_seen_at)}</td>
                <td className="p-3">{u.answers}</td><td className="p-3">{u.tests_passed}</td><td className="p-3">{u.errors_open}</td>
                <td className="p-3">{u.payments_count || '—'}</td>
                <td className="p-3 text-xs text-slate-500">{formatDateOnly(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <Empty>Никого не нашли. Попробуйте другой фильтр или запрос.</Empty>}
      </div>
      <Pager base="/admin/users" params={base} page={page} perPage={perPage} total={total} />
    </div>
  );
}

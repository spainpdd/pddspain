import { listClaims } from '@/lib/repo/admin';
import { RevokeClaim } from '@/components/admin/SmallForms';
import { formatDate } from '@/lib/utils';

export default async function AdminClaims() {
  const claims = await listClaims();
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Заявки по гарантии</h1>
      <p className="mb-5 text-sm text-slate-400">Пользователь отмечает «не сдал» — доступ продлевается автоматически. Если данные сомнительны, отзовите заявку: добавленные дни вернутся обратно.</p>
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs text-slate-500"><tr><th className="p-3">Пользователь</th><th className="p-3">Дата экзамена</th><th className="p-3">Результат</th><th className="p-3">Дней</th><th className="p-3">Подана</th><th className="p-3" /></tr></thead>
          <tbody>
            {claims.map((c: any) => (
              <tr key={c.id} className={`border-b border-slate-200/60 ${c.revoked ? 'opacity-40 line-through' : ''}`}>
                <td className="p-3">{c.display_name}{c.telegram_username ? ` (@${c.telegram_username})` : ''}</td>
                <td className="p-3">{formatDate(c.exam_date + 'T12:00:00Z')}</td>
                <td className="p-3">{c.result === 'passed' ? 'сдал' : 'не сдал'}</td>
                <td className="p-3">{c.days_added}</td>
                <td className="p-3 text-xs text-slate-500">{formatDate(c.created_at instanceof Date ? c.created_at.toISOString() : c.created_at)}</td>
                <td className="p-3">{!c.revoked && <RevokeClaim id={c.id} />}</td>
              </tr>
            ))}
            {claims.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">Заявок пока нет</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

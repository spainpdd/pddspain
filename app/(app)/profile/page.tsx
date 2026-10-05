import Link from 'next/link';
import { accessInfo, requireUser } from '@/lib/auth';
import { getStats } from '@/lib/repo/users';
import { getPricing } from '@/lib/repo/config';
import { getDisplayCurrency } from '@/lib/site-currency';
import { getDb } from '@/lib/db';
import { ClaimForm, SettingsForm } from '@/components/ProfileForms';
import { formatDate, formatPrice, plural } from '@/lib/utils';
import { GUARANTEE_EXTENSION_DAYS } from '@/lib/engine';

export const metadata = { title: 'Профиль' };

export default async function ProfilePage() {
  const user = await requireUser();
  const [stats, acc, pricing] = await Promise.all([getStats(user.id), accessInfo(user), getPricing()]);
  const db = await getDb();
  const claims = await db.query(`select to_char(exam_date, 'YYYY-MM-DD') as exam_date, result, days_added, revoked from exam_claims where user_id = $1 order by created_at desc limit 10`, [user.id]);

  return (
    <div className="space-y-6">
      <div className="card flex items-center gap-4 p-4">
        {user.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.photo_url} alt="" className="h-14 w-14 rounded-full" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-xl font-bold">{(user.display_name ?? '?')[0]}</div>
        )}
        <div>
          <div className="text-lg font-semibold">{user.display_name}</div>
          <div className="text-sm text-slate-400">{user.telegram_username ? `@${user.telegram_username}` : `Telegram ID ${user.telegram_id}`}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4"><div className="text-2xl font-bold text-brand-400">{stats.total_answers}</div><div className="text-xs text-slate-400">Всего ответов</div></div>
        <div className="card p-4"><div className="text-2xl font-bold text-green-600">{stats.accuracy}%</div><div className="text-xs text-slate-400">Точность</div></div>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-400">Язык</h2>
        <SettingsForm study={user.study_lang} trans={user.trans_lang} auto={user.auto_translate} notify={user.notify} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-400">Подписка</h2>
        <div className="card space-y-3 p-4 text-sm">
          {acc.paid ? (
            <p>Доступ до <b>{formatDate(user.access_until)}</b> · осталось {acc.daysLeft} {plural(acc.daysLeft, 'день', 'дня', 'дней')}</p>
          ) : (
            <p className="text-slate-700">
              {user.access_until ? `Доступ закончился ${formatDate(user.access_until)}.` : 'Подписки нет.'}
            </p>
          )}
          <Link href="/pay" className="btn btn-primary btn-sm">{acc.paid ? 'Продлить на 100 дней' : `Открыть доступ — ${formatPrice(pricing, getDisplayCurrency(user.trans_lang))}`}</Link>
        </div>
      </section>

      {user.guarantee_eligible && !user.exam_passed_at && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-400">Гарантия «до сдачи»</h2>
          <div className="card space-y-3 p-4 text-sm">
            <p className="text-slate-700">
              Если экзамен не сдан с первого раза — отметьте это, и доступ продлится на {GUARANTEE_EXTENSION_DAYS} дней. Так можно повторять, пока не сдадите.
            </p>
            <ClaimForm />
            {claims.length > 0 && (
              <ul className="space-y-1 border-t border-slate-200 pt-3 text-xs text-slate-400">
                {claims.map((c: any, i: number) => (
                  <li key={i} className={c.revoked ? 'line-through opacity-50' : ''}>
                    {formatDate(c.exam_date + 'T12:00:00Z')} · {c.result === 'passed' ? 'сдал(а)' : `не сдал(а), +${c.days_added} дн.`}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
      {user.exam_passed_at && (
        <div className="card p-4 text-center text-green-600">Экзамен сдан {formatDate(user.exam_passed_at)} — поздравляем! 🎉</div>
      )}

      <div className="space-y-2 pt-2">
        {user.is_admin && <Link href="/admin" className="btn btn-ghost w-full">Админка</Link>}
        <form action="/api/auth/logout" method="post">
          <button className="btn btn-ghost w-full text-slate-400">Выйти</button>
        </form>
        <p className="pt-2 text-center text-xs text-slate-600">
          <Link href="/legal" className="underline">Условия и конфиденциальность</Link>
        </p>
      </div>
    </div>
  );
}

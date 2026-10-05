import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { env } from '@/lib/env';
import { countNewReports } from '@/lib/repo/reports';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Админка', robots: { index: false, follow: false } };

const nav = [
  ['/admin', 'Обзор'],
  ['/admin/users', 'Пользователи'],
  ['/admin/payments', 'Платежи'],
  ['/admin/reports', 'Сообщения'],
  ['/admin/claims', 'Гарантия'],
  ['/admin/questions', 'Вопросы'],
  ['/admin/topics', 'Темы'],
  ['/admin/tests', 'Тесты'],
  ['/admin/useful', 'Полезно'],
  ['/admin/pricing', 'Цены'],
  ['/admin/audit', 'Журнал'],
  ['/admin/data', 'Импорт / экспорт'],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const newReports = await countNewReports().catch(() => 0);
  return (
    <div className="min-h-dvh">
      {env.serveUnverified && (
        <div className="bg-red-700 px-4 py-2 text-center text-sm font-medium text-white" data-testid="unverified-banner">
          Включён SERVE_UNVERIFIED_QUESTIONS: пользователям показываются вопросы с непроверенными правами. Не оставляйте так на боевом сайте.
        </div>
      )}
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
          <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-700">← Приложение</Link>
          <nav className="flex flex-wrap gap-1">
            {nav.map(([href, label]) => (
              <Link key={href} href={href} className="rounded-lg px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">{label}
                {href === '/admin/reports' && newReports > 0 && (
                  <span className="ml-1.5 rounded-full bg-red-600 px-1.5 py-0.5 text-[11px] font-semibold text-white" data-testid="reports-badge">{newReports}</span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}

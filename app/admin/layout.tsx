import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Админка', robots: { index: false, follow: false } };

const nav = [
  ['/admin', 'Обзор'],
  ['/admin/questions', 'Вопросы'],
  ['/admin/topics', 'Темы'],
  ['/admin/tests', 'Тесты'],
  ['/admin/users', 'Пользователи'],
  ['/admin/claims', 'Гарантия'],
  ['/admin/data', 'Импорт / экспорт'],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-dvh">
      {env.serveUnverified && (
        <div className="bg-red-700 px-4 py-2 text-center text-sm font-medium text-white" data-testid="unverified-banner">
          Включён SERVE_UNVERIFIED_QUESTIONS: пользователям показываются вопросы с непроверенными правами. Не оставляйте так на боевом сайте.
        </div>
      )}
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
          <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-300">← Приложение</Link>
          <nav className="flex flex-wrap gap-1">
            {nav.map(([href, label]) => (
              <Link key={href} href={href} className="rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800">{label}</Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}

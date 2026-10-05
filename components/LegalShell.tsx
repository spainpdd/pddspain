import Link from 'next/link';

export function LegalShell({ title, date, children }: { title: string; date: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 text-sm leading-relaxed text-slate-700" lang="ru">
      <Link href="/" className="text-xs text-slate-500 underline">← На главную</Link>
      <h1 className="mb-1 mt-4 text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mb-6 text-xs text-slate-400">Редакция от {date}</p>
      {children}
      <nav className="mt-10 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-200 pt-4 text-xs text-slate-500">
        <Link href="/legal/offer" className="underline">Оферта</Link>
        <Link href="/legal/privacy" className="underline">Политика конфиденциальности</Link>
        <Link href="/legal/consent" className="underline">Согласие на обработку данных</Link>
        <Link href="/legal" className="underline">Источники и условия</Link>
      </nav>
    </main>
  );
}

export function H2({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mt-8 text-lg font-semibold text-slate-900">
      {children}
    </h2>
  );
}

export const P = ({ children }: { children: React.ReactNode }) => <p className="mt-2">{children}</p>;

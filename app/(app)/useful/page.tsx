import Link from 'next/link';
import { ChevronRight, Lightbulb } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { canSeeUseful } from '@/lib/engine';
import UsefulLock from '@/components/useful/UsefulLock';
import { listPublicUseful } from '@/lib/repo/useful';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Полезно' };

export default async function UsefulPage() {
  const user = await requireUser();
  if (!canSeeUseful(user)) return <UsefulLock />;
  const groups = await listPublicUseful(user.trans_lang);

  return (
    <div>
      <h1 className="text-2xl font-bold">Полезно</h1>
      <p className="mt-1 text-sm text-slate-500">Инструкции и подсказки: документы, запись на экзамен, права из других стран.</p>

      {groups.length === 0 ? (
        <div className="card mt-6 p-6 text-center" data-testid="useful-empty">
          <Lightbulb className="mx-auto mb-3 text-slate-400" />
          <p className="text-slate-600">Материалы появятся здесь совсем скоро.</p>
        </div>
      ) : (
        <div className="mt-5 space-y-6" data-testid="useful-list">
          {groups.map((g) => (
            <section key={g.id ?? 'loose'}>
              {g.title && <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{g.title}</h2>}
              <div className="space-y-2.5">
                {g.pages.map((p) => (
                  <Link key={p.slug} href={`/useful/${p.slug}`} className="card flex items-center gap-3.5 p-3.5 transition hover:shadow-md" data-testid={`useful-${p.slug}`}>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-2xl" aria-hidden>
                      {p.icon || '📄'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold leading-snug text-slate-900">{p.title}</span>
                      {p.summary && <span className="mt-0.5 line-clamp-2 block text-sm text-slate-500">{p.summary}</span>}
                    </span>
                    <ChevronRight size={18} className="shrink-0 text-slate-400" />
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

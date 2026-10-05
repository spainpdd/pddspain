import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { canSeeUseful } from '@/lib/engine';
import UsefulLock from '@/components/useful/UsefulLock';
import { getPublicPage } from '@/lib/repo/useful';
import Blocks from '@/components/useful/Blocks';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Полезно' };

export default async function UsefulArticlePage({ params }: { params: { slug: string } }) {
  const user = await requireUser();
  if (!canSeeUseful(user)) return <UsefulLock />;
  const page = await getPublicPage(params.slug, user.trans_lang);
  if (!page) notFound();

  return (
    <article>
      <Link href="/useful" className="-ml-1 inline-flex items-center gap-1 rounded-lg px-1 py-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={16} /> Полезно
      </Link>
      <header className="mt-2">
        {page.section && <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{page.section}</div>}
        <h1 className="mt-1 text-2xl font-bold leading-tight" data-testid="useful-title">
          {page.icon && <span className="mr-2" aria-hidden>{page.icon}</span>}
          {page.title}
        </h1>
        {page.summary && <p className="mt-2 text-slate-500">{page.summary}</p>}
      </header>
      <div className="mt-5">
        <Blocks blocks={page.blocks} storageId={page.slug} />
      </div>
    </article>
  );
}

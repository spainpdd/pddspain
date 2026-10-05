import Link from 'next/link';
import { listUsefulAdmin } from '@/lib/repo/useful';
import { formatDateTime } from '@/lib/admin-format';
import { Badge } from '@/components/admin/ui';
import { MoveButtons, SectionsPanel } from '@/components/admin/UsefulPanels';

export const dynamic = 'force-dynamic';

export default async function AdminUsefulPage() {
  const { sections, pages } = await listUsefulAdmin();
  const groups = [
    ...sections.map((s) => ({ id: s.id as string | null, title: s.title.ru, pages: pages.filter((p) => p.section_id === s.id) })),
    { id: null, title: 'Без раздела', pages: pages.filter((p) => !p.section_id || !sections.some((s) => s.id === p.section_id)) },
  ].filter((g) => g.pages.length || g.id);

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Полезно</h1>
        <Link href="/admin/useful/new" className="btn btn-primary btn-sm" data-testid="useful-new">+ Новый материал</Link>
      </div>
      <p className="mb-5 text-sm text-slate-500">
        Инструкции для пользователей: вкладка «Полезно» в приложении. Материал собирается из блоков (текст, фото, видео YouTube, шаги, чек-лист, таблица…).
        Пользователи видят только опубликованные.
      </p>

      <SectionsPanel sections={sections} />

      <div className="mt-6 space-y-6">
        {pages.length === 0 && <div className="card p-6 text-center text-slate-500">Материалов пока нет. Нажмите «Новый материал».</div>}
        {groups.map((g) => (
          <section key={g.id ?? 'none'}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{g.title}</h2>
            <div className="card divide-y divide-slate-200">
              {g.pages.length === 0 && <div className="p-3 text-sm text-slate-400">В этом разделе пока пусто</div>}
              {g.pages.map((p, i) => (
                <div key={p.id} className="flex flex-wrap items-center gap-3 p-3" data-testid="useful-row">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xl">{p.icon || '📄'}</span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/useful/${p.id}`} className="font-medium text-slate-900 hover:text-brand-600">{p.title.ru || '(без названия)'}</Link>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                      <Badge tone={p.status === 'published' ? 'green' : 'amber'}>{p.status === 'published' ? 'Опубликован' : 'Черновик'}</Badge>
                      <Badge tone={p.has_hy ? 'blue' : 'slate'}>{p.has_hy ? 'RU + HY' : 'только RU'}</Badge>
                      <span>/{p.slug}</span>
                      <span>· изменён {formatDateTime(p.updated_at)}</span>
                    </div>
                  </div>
                  <MoveButtons id={p.id} first={i === 0} last={i === g.pages.length - 1} />
                  <div className="flex gap-2">
                    {p.status === 'published' && <Link href={`/useful/${p.slug}`} className="btn btn-ghost btn-sm" target="_blank">Открыть</Link>}
                    <Link href={`/admin/useful/${p.id}`} className="btn btn-ghost btn-sm">Править</Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

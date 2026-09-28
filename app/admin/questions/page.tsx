import Link from 'next/link';
import { listQuestions, listTopics, type QuestionFilters } from '@/lib/repo/admin';
import { RIGHTS_STATUSES, type Lang } from '@/lib/types';
import QuestionsTable from '@/components/admin/QuestionsTable';

const RIGHTS_LABEL: Record<string, string> = { own: 'свой', dgt_official: 'DGT официальный', licensed: 'лицензия', unverified: 'не подтверждено' };

export default async function QuestionsPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const f: QuestionFilters = {
    q: searchParams.q?.trim() || undefined,
    rights: searchParams.rights || undefined,
    active: (searchParams.active as any) || '',
    missing: (searchParams.missing as Lang) || '',
    machine: (searchParams.machine as Lang) || '',
    topic: searchParams.topic || undefined,
    test: searchParams.test ? Number(searchParams.test) : undefined,
    page: searchParams.page ? Number(searchParams.page) : 1,
  };
  const [{ rows, total, perPage }, topics] = await Promise.all([listQuestions(f), listTopics()]);
  const pages = Math.max(Math.ceil(total / perPage), 1);
  const page = f.page ?? 1;
  const qs = (p: number) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) if (v && k !== 'page') u.set(k, v);
    u.set('page', String(p));
    return `/admin/questions?${u}`;
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Вопросы <span className="text-base font-normal text-slate-500">({total})</span></h1>
        <Link href="/admin/questions/new" className="btn btn-primary btn-sm">+ Новый вопрос</Link>
      </div>

      <form className="card mb-4 grid grid-cols-2 gap-2 p-3 md:grid-cols-4 lg:grid-cols-8" data-testid="filters">
        <input name="q" defaultValue={f.q} placeholder="Поиск по тексту" className="input col-span-2" />
        <select name="topic" defaultValue={f.topic ?? ''} className="input">
          <option value="">Все темы</option>
          {topics.filter((t) => t.topic).map((t) => <option key={t.topic} value={t.topic!}>{t.topic} ({t.n})</option>)}
        </select>
        <select name="rights" defaultValue={f.rights ?? ''} className="input">
          <option value="">Любые права</option>
          {RIGHTS_STATUSES.map((r) => <option key={r} value={r}>{RIGHTS_LABEL[r]}</option>)}
        </select>
        <select name="active" defaultValue={f.active} className="input">
          <option value="">Любые</option><option value="yes">Активные</option><option value="no">Скрытые</option>
        </select>
        <select name="missing" defaultValue={f.missing} className="input">
          <option value="">Перевод: любой</option>
          {(['en', 'ru', 'hy'] as Lang[]).map((l) => <option key={l} value={l}>Нет {l.toUpperCase()}</option>)}
        </select>
        <select name="machine" defaultValue={f.machine} className="input">
          <option value="">Проверка: любая</option>
          {(['es', 'en', 'ru', 'hy'] as Lang[]).map((l) => <option key={l} value={l}>{l.toUpperCase()} не проверен</option>)}
        </select>
        <button className="btn btn-ghost btn-sm">Показать</button>
      </form>

      <QuestionsTable rows={JSON.parse(JSON.stringify(rows))} topics={topics.filter((t) => t.topic).map((t) => t.topic!)} />

      <div className="mt-4 flex items-center justify-center gap-3 text-sm">
        {page > 1 && <Link href={qs(page - 1)} className="btn btn-ghost btn-sm">←</Link>}
        <span className="text-slate-400">{page} / {pages}</span>
        {page < pages && <Link href={qs(page + 1)} className="btn btn-ghost btn-sm">→</Link>}
      </div>
    </div>
  );
}

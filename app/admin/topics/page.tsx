import Link from 'next/link';
import { listTopics } from '@/lib/repo/admin';
import { RenameTopic } from '@/components/admin/SmallForms';

export default async function TopicsPage() {
  const topics = await listTopics();
  const names = topics.filter((t) => t.topic).map((t) => t.topic!);
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Темы</h1>
      <p className="mb-5 text-sm text-slate-400">
        Переименуйте тему — изменится у всех её вопросов. Если новое имя совпадает с существующей темой, темы объединятся. Пустое имя = «без темы».
        Назначить тему отдельным вопросам можно в редакторе вопроса или массово в списке вопросов.
      </p>
      <div className="card divide-y divide-slate-800/70">
        {topics.map((t) => (
          <div key={t.topic ?? '__null'} className="flex flex-wrap items-center justify-between gap-3 p-3" data-testid="topic-row">
            <div className="flex items-center gap-3">
              <Link href={t.topic ? `/admin/questions?topic=${encodeURIComponent(t.topic)}` : '/admin/questions'} className="min-w-[8rem] font-medium hover:text-brand-400">
                {t.topic ?? <span className="text-slate-500">без темы</span>}
              </Link>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">{t.n}</span>
            </div>
            {t.topic && <RenameTopic topic={t.topic} topics={names} />}
          </div>
        ))}
        {topics.length === 0 && <div className="p-6 text-center text-slate-500">Тем пока нет</div>}
      </div>
    </div>
  );
}

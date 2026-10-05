import Link from 'next/link';
import { listAllTests } from '@/lib/repo/admin';
import { TEST_SIZE } from '@/lib/engine';
import { TEST_CATEGORIES, type TestCategory } from '@/lib/types';
import { cn } from '@/lib/utils';

const TITLES: Record<TestCategory, string> = { official: 'Официальные (official)', mixed: 'Дополнительные (mixed)' };

export default async function AdminTests() {
  const [official, mixed] = await Promise.all(TEST_CATEGORIES.map((c) => listAllTests(c)));
  const byCategory = { official, mixed } as Record<TestCategory, any[]>;
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Тесты</h1>
      <p className="mb-5 text-sm text-slate-400">
        Тесты создаются в разделе «Импорт / экспорт» (автосборка — только официальные) или импортом файла с составом. Здесь можно заменить любой вопрос в тесте.
        Красным — в тесте меньше {TEST_SIZE} доступных пользователю вопросов.
      </p>
      {TEST_CATEGORIES.map((cat) => (
        <div key={cat} className="mb-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">{TITLES[cat]}</h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 md:grid-cols-10">
            {byCategory[cat].map((t: any) => (
              <Link
                key={t.number}
                href={`/admin/tests/${cat}/${t.number}`}
                className={cn('card p-3 text-center hover:bg-ink-800', t.playable < TEST_SIZE && 'border-red-500/40')}
              >
                <div className="text-lg font-bold">{t.number}</div>
                <div className={cn('text-[11px]', t.playable < TEST_SIZE ? 'text-red-700' : 'text-slate-500')}>{t.playable}/{t.slots}</div>
              </Link>
            ))}
            {byCategory[cat].length === 0 && <div className="card col-span-full p-6 text-center text-slate-500">Тестов пока нет</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

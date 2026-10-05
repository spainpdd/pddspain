import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTestSlots } from '@/lib/repo/admin';
import { SlotEditor } from '@/components/admin/SmallForms';
import { TEST_CATEGORIES, type TestCategory } from '@/lib/types';
import { cn } from '@/lib/utils';

export default async function AdminTest({ params }: { params: { category: string; n: string } }) {
  const category = params.category as TestCategory;
  if (!TEST_CATEGORIES.includes(category)) notFound();
  const n = Number(params.n);
  if (!Number.isInteger(n) || n < 1) notFound();
  const slots = await getTestSlots(category, n);
  if (!slots.length) notFound();
  return (
    <div>
      <Link href="/admin/tests" className="text-sm text-slate-500 hover:text-slate-700">← Все тесты</Link>
      <h1 className="mb-1 mt-2 text-2xl font-bold">
        Тест {n} <span className="text-base font-normal text-slate-500">({category === 'official' ? 'официальный' : 'дополнительный'})</span>
      </h1>
      <p className="mb-5 text-sm text-slate-400">
        Чтобы заменить вопрос, вставьте ID другого вопроса (его видно в адресе страницы редактирования) и нажмите «Заменить». Один вопрос не может стоять в тесте дважды.
      </p>
      <div className="card divide-y divide-slate-800/70">
        {slots.map((s: any) => (
          <div key={s.position} className={cn('flex flex-wrap items-center gap-3 p-3', !s.is_active && 'opacity-60')}>
            <span className="w-7 text-right text-sm text-slate-500">{s.position}</span>
            <Link href={`/admin/questions/${s.question_id}`} className="min-w-0 flex-1 basis-64 text-sm hover:text-brand-400">
              <span className="line-clamp-2">{s.text_es ?? '—'}</span>
              <span className="text-[11px] text-slate-500">{!s.is_active ? 'скрыт · ' : ''}{s.rights_status === 'unverified' ? 'права не подтверждены · ' : ''}ответ {s.correct.toUpperCase()}</span>
            </Link>
            <SlotEditor category={category} n={n} pos={s.position} current={s.question_id} />
          </div>
        ))}
      </div>
    </div>
  );
}

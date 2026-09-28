import Link from 'next/link';
import { Lock, Check } from 'lucide-react';
import { accessInfo, requireUser } from '@/lib/auth';
import { listTests } from '@/lib/repo/content';
import { TEST_COUNT, MAX_ERRORS, canOpenTest } from '@/lib/engine';
import type { TestCategory, TestListItem } from '@/lib/types';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Тесты' };

export default async function TestsListPage() {
  const user = await requireUser();
  const tests = await listTests(user.id);
  const acc = accessInfo(user);
  const official = tests.filter((t) => t.category === 'official');
  const mixed = tests.filter((t) => t.category === 'mixed');

  return (
    <div>
      <h1 className="text-2xl font-bold">Тесты</h1>

      <Section
        title="Официальные тесты DGT"
        note={`Не больше ${MAX_ERRORS} ошибок — откроется следующий тест. Больше — пересдаёте этот.`}
        tests={official}
        acc={acc}
        soon={Math.max(TEST_COUNT - official.length, 0)}
      />

      {mixed.length > 0 && (
        <Section
          title="Дополнительные тесты"
          note="Вопросы из открытых источников, для личной практики. Без ограничений: доступны все и сразу, вне очереди основных тестов."
          tests={mixed}
          acc={acc}
        />
      )}
    </div>
  );
}

function Section({
  title,
  note,
  tests,
  acc,
  soon,
}: {
  title: string;
  note: string;
  tests: TestListItem[];
  acc: { paid: boolean; freeTests: number };
  soon?: number;
}) {
  const category: TestCategory | null = tests[0]?.category ?? null;
  return (
    <div className="mb-8">
      <h2 className="mt-4 text-sm font-semibold uppercase tracking-wide text-slate-400">{title}</h2>
      <p className="mb-4 mt-1 text-sm text-slate-400">{note}</p>

      {tests.length === 0 && <div className="card p-5 text-sm text-slate-400">Тесты ещё не добавлены.</div>}

      <div className="grid grid-cols-5 gap-2.5" data-testid={category ? `test-grid-${category}` : undefined}>
        {tests.map((t) => {
          const allowed = canOpenTest(t.category, t.number, acc.paid, acc.freeTests);
          const locked = t.status === 'locked';
          const href = locked ? null : allowed ? `/test/${t.category}/${t.number}` : '/pay';
          const cls = cn(
            'relative flex aspect-square flex-col items-center justify-center rounded-2xl border text-lg font-semibold transition',
            t.status === 'passed' && 'border-green-600/50 bg-green-500/10 text-green-300',
            t.status === 'available' && 'border-brand-500 bg-brand-500/10 text-white',
            locked && 'border-slate-800 bg-ink-900/50 text-slate-600',
            !locked && !allowed && 'border-slate-700 bg-ink-900 text-slate-400',
          );
          const inner = (
            <>
              <span>{t.number}</span>
              {t.status === 'passed' && (
                <span className="flex items-center gap-0.5 text-[10px] font-medium text-green-400/80">
                  <Check size={10} strokeWidth={3} />
                  {t.best_errors}
                </span>
              )}
              {(locked || (!locked && !allowed)) && <Lock size={12} className="absolute right-1.5 top-1.5 opacity-60" />}
            </>
          );
          const testid = `test-${t.category}-${t.number}`;
          return href ? (
            <Link key={t.number} href={href} className={cls} data-testid={testid} data-status={t.status}>
              {inner}
            </Link>
          ) : (
            <div key={t.number} className={cls} data-testid={testid} data-status="locked">
              {inner}
            </div>
          );
        })}
      </div>

      {!!soon && soon > 0 && tests.length > 0 && <p className="mt-5 text-center text-xs text-slate-500">Ещё {soon} тестов готовятся.</p>}
      {tests.length > 0 && <p className="mt-2 text-center text-xs text-slate-600">Цифра в зелёной плитке — лучший результат (ошибок).</p>}
    </div>
  );
}

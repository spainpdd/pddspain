import Link from 'next/link';
import { Lock, Check } from 'lucide-react';
import { accessInfo, requireUser } from '@/lib/auth';
import { listTests } from '@/lib/repo/content';
import { TEST_COUNT, MAX_ERRORS, canOpenTest, errorTone, type ErrorTone, type FreeAccess } from '@/lib/engine';
import type { TestCategory, TestListItem } from '@/lib/types';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Тесты' };

const TONE_CLS: Record<Exclude<ErrorTone, 'none'>, string> = {
  perfect: 'border-green-600/50 bg-green-500/15 text-green-700',
  one: 'border-yellow-500/60 bg-yellow-400/25 text-yellow-800',
  two: 'border-orange-500/60 bg-orange-500/15 text-orange-700',
  bad: 'border-red-500/60 bg-red-500/15 text-red-700',
};

function Legend({ cls, text }: { cls: string; text: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('h-3 w-3 rounded', cls)} />
      {text}
    </span>
  );
}

export default async function TestsListPage() {
  const user = await requireUser();
  const [tests, acc] = await Promise.all([listTests(user.id), accessInfo(user)]);
  const official = tests.filter((t) => t.category === 'official');
  const mixed = tests.filter((t) => t.category === 'mixed');

  return (
    <div>
      <h1 className="text-2xl font-bold">Тесты</h1>

      {!acc.paid && (
        <div className="card mt-3 p-3.5 text-sm text-slate-600" data-testid="free-banner">
          Бесплатно: тесты идут по порядку с первого, один новый тест в день (из первых 20).{' '}
          {acc.todayFreeTest !== null && <>Сегодняшний тест уже начат — следующий откроется завтра. </>}
          <Link href="/pay" className="font-medium text-brand-600 underline">
            Открыть без ограничений
          </Link>
        </div>
      )}

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
  acc: FreeAccess;
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
          const allowed = canOpenTest(t.category, t.number, acc);
          const locked = t.status === 'locked';
          const tone: ErrorTone = t.category === 'official' && !locked && allowed ? errorTone(t.best_errors) : 'none';
          const href = locked ? null : allowed ? `/test/${t.category}/${t.number}` : '/pay';
          const cls = cn(
            'relative flex aspect-square flex-col items-center justify-center rounded-2xl border text-lg font-semibold transition',
            tone === 'perfect' && TONE_CLS.perfect,
            tone === 'one' && TONE_CLS.one,
            tone === 'two' && TONE_CLS.two,
            tone === 'bad' && TONE_CLS.bad,
            tone === 'none' && t.status === 'available' && 'border-brand-500 bg-brand-500/10 text-brand-700',
            locked && 'border-slate-200 bg-ink-900/50 text-slate-400',
            !locked && !allowed && 'border-slate-200 bg-ink-900 text-slate-400',
          );
          const inner = (
            <>
              <span>{t.number}</span>
              {t.best_errors !== null && t.category === 'official' && (
                <span className="flex items-center gap-0.5 text-[10px] font-medium opacity-80">
                  {t.status === 'passed' && <Check size={10} strokeWidth={3} />}
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
      {category === 'official' && tests.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-slate-500" data-testid="tone-legend">
          <Legend cls="bg-green-500" text="0 ошибок" />
          <Legend cls="bg-yellow-400" text="1" />
          <Legend cls="bg-orange-500" text="2" />
          <Legend cls="bg-red-500" text="3+ (не сдан)" />
        </div>
      )}
      {tests.length > 0 && <p className="mt-2 text-center text-xs text-slate-500">Цифра в плитке — лучший результат (ошибок).</p>}
    </div>
  );
}

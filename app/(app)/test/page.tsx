import Link from 'next/link';
import { Lock, Check, Target, Trophy, ChevronRight } from 'lucide-react';
import { accessInfo, requireUser } from '@/lib/auth';
import { getCourse } from '@/lib/repo/content';
import { canOpenCheckpoint, canOpenTest, CHECK_MINUTES, errorTone, MAX_ERRORS, type CheckpointInfo, type ErrorTone } from '@/lib/engine';
import { plural } from '@/lib/utils';
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
  const [{ tests: list, checkpoints }, acc] = await Promise.all([getCourse(user.id), accessInfo(user)]);
  // один курс: сначала тесты официального набора, затем остальные; нумерация сквозная.
  // После каждых 10 тестов (и в конце) — широкая плитка проверки.
  const checkAfter = new Map(checkpoints.map((c) => [c.milestone, c]));

  return (
    <div>
      <h1 className="text-2xl font-bold">Тесты</h1>

      {!acc.paid && (
        <div className="card mt-3 p-3.5 text-sm text-slate-600" data-testid="free-banner">
          Доступен 1 бесплатный тест в день. Следующий откроется завтра.{' '}
          <Link href="/pay" className="font-medium text-brand-600 underline">
            Открыть все тесты без ограничений
          </Link>
        </div>
      )}

      <div className="mb-8 mt-5">
        {list.length === 0 && <div className="card p-5 text-sm text-slate-400">Тесты ещё не добавлены.</div>}

        <div className="grid grid-cols-5 gap-2.5" data-testid="test-grid">
          {list.map((t) => {
            const allowed = canOpenTest(t, acc);
            const locked = t.status === 'locked';
            const tone: ErrorTone = !locked && allowed ? errorTone(t.best_errors) : 'none';
            const href = locked ? null : allowed ? `/test/${t.category}/${t.number}` : '/pay';
            const cls = cn(
              'relative flex aspect-square flex-col items-center justify-center rounded-2xl border text-lg font-semibold transition',
              tone === 'perfect' && TONE_CLS.perfect,
              tone === 'one' && TONE_CLS.one,
              tone === 'two' && TONE_CLS.two,
              tone === 'bad' && TONE_CLS.bad,
              tone === 'none' && t.status === 'available' && allowed && 'border-brand-500 bg-brand-500/10 text-brand-700',
              locked && 'border-slate-200 bg-ink-900/50 text-slate-400',
              !locked && !allowed && 'border-slate-200 bg-ink-900 text-slate-400',
            );
            const inner = (
              <>
                <span>{t.display}</span>
                {t.best_errors !== null && (
                  <span className="flex items-center gap-0.5 text-[10px] font-medium opacity-80">
                    {t.status === 'passed' && <Check size={10} strokeWidth={3} />}
                    {t.best_errors}
                  </span>
                )}
                {(locked || !allowed) && <Lock size={12} className="absolute right-1.5 top-1.5 opacity-60" />}
              </>
            );
            const testid = `test-${t.category}-${t.number}`;
            const tile = href ? (
              <Link key={testid} href={href} className={cls} data-testid={testid} data-status={t.status}>
                {inner}
              </Link>
            ) : (
              <div key={testid} className={cls} data-testid={testid} data-status="locked">
                {inner}
              </div>
            );
            const cp = checkAfter.get(t.display);
            return cp ? [tile, <CheckTile key={`check-${cp.milestone}`} cp={cp} open={canOpenCheckpoint(cp.milestone, acc.paid)} />] : tile;
          })}
        </div>

        {list.length > 0 && (
          <div className="mt-8" data-testid="tone-legend">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
              <Legend cls="bg-green-500" text="0 ошибок" />
              <Legend cls="bg-yellow-400" text="1" />
              <Legend cls="bg-orange-500" text="2" />
              <Legend cls="bg-red-500" text="3+ (не сдан)" />
            </div>
            <p className="mt-2 text-center text-xs text-slate-500">
              После каждых 10 тестов — проверка из случайных пройденных тестов: следующий тест откроется после неё.
            </p>
            <p className="mt-2 text-center text-xs text-slate-500">Цифра в плитке — лучший результат (ошибок).</p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Широкая плитка проверки («закрепление» после каждых 10 тестов, «финал» в конце курса) */
function CheckTile({ cp, open }: { cp: CheckpointInfo; open: boolean }) {
  const final = cp.kind === 'final';
  const passed = cp.status === 'passed';
  const locked = cp.status === 'locked';
  const Icon = final ? Trophy : Target;
  const href = locked ? null : open ? `/test/check/${cp.milestone}` : '/pay';
  const cls = cn(
    'col-span-5 flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition',
    passed && 'border-green-600/50 bg-green-500/15 text-green-800',
    cp.status === 'available' && open && 'border-amber-500/70 bg-amber-400/20 text-amber-900',
    ((cp.status === 'available' && !open) || locked) && 'border-slate-200 bg-ink-900/50 text-slate-400',
  );
  const inner = (
    <>
      <Icon size={22} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="font-semibold leading-tight">{final ? 'Финальная проверка' : 'Закрепление'}</div>
        <div className="mt-0.5 text-xs opacity-80">
          {cp.tests} {plural(cp.tests, 'тест', 'теста', 'тестов')} подряд · по {CHECK_MINUTES} мин · до {MAX_ERRORS} ошибок
        </div>
      </div>
      {passed ? <Check size={20} strokeWidth={3} /> : locked || !open ? <Lock size={16} /> : <ChevronRight size={20} />}
    </>
  );
  const testid = `check-${cp.milestone}`;
  return href ? (
    <Link href={href} className={cls} data-testid={testid} data-status={cp.status}>
      {inner}
    </Link>
  ) : (
    <div className={cls} data-testid={testid} data-status="locked">
      {inner}
    </div>
  );
}

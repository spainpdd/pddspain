'use client';

/**
 * Проверка («закрепление»): несколько случайных тестов подряд, по CHECK_MINUTES минут на каждый,
 * без подсказок и пояснений. Результат показывается только в самом конце.
 * Ход (ответы и время старта каждого теста) хранится в localStorage: обновление страницы ничего не теряет,
 * а таймер продолжает идти.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Trophy, Clock } from 'lucide-react';
import type { AnswerMap, PlayerQuestion, StudyLang, TransLang } from '@/lib/types';
import type { CheckResult, RunTestWithQuestions } from '@/lib/repo/checkpoints';
import { MAX_ERRORS } from '@/lib/engine';
import { cn, plural } from '@/lib/utils';
import Runner, { clearSaved, loadSavedAnswers, type LangState } from './Runner';

interface Props {
  runId: string;
  milestone: number;
  final: boolean;
  tests: RunTestWithQuestions[];
  minutes: number;
  settings: { study: StudyLang; trans: TransLang; auto: boolean };
}

interface Stored {
  /** индекс теста → когда начат (мс) */
  started: Record<number, number>;
  /** ключ теста → ответы */
  done: Record<string, AnswerMap>;
}

type Phase = 'loading' | 'intro' | 'play' | 'between' | 'submitting' | 'result' | 'review';

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Ошибка ${res.status}`);
  return data;
}

export default function CheckPlayer({ runId, milestone, final, tests, minutes, settings }: Props) {
  const router = useRouter();
  const storeKey = `dgt:check:${runId}`;
  const runnerKey = (i: number) => `${storeKey}:${tests[i].key}`;
  const [lang, setLang] = useState<LangState>({ study: settings.study, trans: settings.trans, showTrans: settings.auto });
  const [stored, setStored] = useState<Stored | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [err, setErr] = useState<string | null>(null);
  const [askExit, setAskExit] = useState(false);
  const [reviewQs, setReviewQs] = useState<PlayerQuestion[]>([]);
  const limitMs = minutes * 60_000;

  const save = useCallback(
    (next: Stored) => {
      setStored(next);
      try {
        localStorage.setItem(storeKey, JSON.stringify(next));
      } catch {}
    },
    [storeKey],
  );

  // восстановление хода
  useEffect(() => {
    let s: Stored = { started: {}, done: {} };
    try {
      const raw = JSON.parse(localStorage.getItem(storeKey) || 'null') as Stored | null;
      if (raw && raw.started && raw.done) s = raw;
    } catch {}
    setStored(s);
  }, [storeKey]);

  const finished = stored ? tests.filter((t) => stored.done[t.key]).length : 0;
  const idx = Math.min(finished, tests.length - 1);

  // фаза выводится из сохранённого хода, пока не показаны результаты
  useEffect(() => {
    if (!stored || phase === 'result' || phase === 'review' || phase === 'submitting') return;
    if (finished >= tests.length) return;
    setPhase(stored.started[finished] ? 'play' : finished === 0 ? 'intro' : 'between');
  }, [stored, finished, tests.length, phase]);

  const submit = useCallback(
    async (done: Record<string, AnswerMap>) => {
      setErr(null);
      setPhase('submitting');
      try {
        const r: CheckResult = await post(`/api/checkpoints/${milestone}/submit`, { runId, answers: done });
        setResult(r);
        try {
          localStorage.removeItem(storeKey);
          tests.forEach((t) => clearSaved(`${storeKey}:${t.key}`));
        } catch {}
        setPhase('result');
      } catch (e: any) {
        setErr(e.message);
        setPhase('between');
      }
    },
    [milestone, runId, storeKey, tests],
  );

  // все тесты пройдены, но результат не отправлен (обновили страницу в этот момент) — отправляем
  useEffect(() => {
    if (stored && finished >= tests.length && phase !== 'submitting' && phase !== 'result' && phase !== 'review' && !err) void submit(stored.done);
  }, [stored, finished, tests.length, phase, submit, err]);

  const startTest = () => {
    if (!stored) return;
    save({ ...stored, started: { ...stored.started, [finished]: Date.now() } });
    setPhase('play');
  };

  const finishTest = useCallback(
    (answers: AnswerMap) => {
      if (!stored) return;
      const key = tests[idx].key;
      if (stored.done[key]) return;
      clearSaved(runnerKey(idx));
      const done = { ...stored.done, [key]: answers };
      save({ ...stored, done });
      if (Object.keys(done).length >= tests.length) void submit(done);
      else setPhase('between');
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stored, idx, tests, save, submit],
  );

  const onTimeUp = useCallback(
    (answers: AnswerMap) => {
      // если пользователь вернулся после перерыва, берём всё, что успело сохраниться
      finishTest(Object.keys(answers).length ? answers : loadSavedAnswers(runnerKey(idx)));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [finishTest, idx],
  );

  const changeLang = useCallback((l: LangState) => {
    setLang(l);
    fetch('/api/me', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ study_lang: l.study, trans_lang: l.trans }) }).catch(() => {});
  }, []);

  const deadline = stored?.started[finished] ? stored.started[finished] + limitMs : undefined;
  const title = final ? 'Финальная проверка' : 'Проверка: закрепление';
  const totalErrors = useMemo(() => result?.tests.reduce((n, t) => n + t.errors, 0) ?? 0, [result]);

  if (phase === 'loading' || !stored) return null;

  // ---------------------------------------------------------------- вступление
  if (phase === 'intro') {
    return (
      <Screen>
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/15 text-brand-600">
          {final ? <Trophy size={32} /> : <Clock size={32} />}
        </div>
        <h1 className="mt-4 text-2xl font-bold" data-testid="check-title">{title}</h1>
        <p className="mt-2 max-w-xs text-slate-500">
          {final
            ? 'Последний рубеж: случайные тесты из всего курса.'
            : `Закрепляем пройденное: случайные тесты из первых ${milestone}.`}
        </p>
        <ul className="mt-5 w-full max-w-xs space-y-1.5 rounded-2xl border border-slate-200 bg-ink-900 p-4 text-left text-sm text-slate-600">
          <li>
            Тестов подряд: <b>{tests.length}</b>
          </li>
          <li>
            Время: <b>{minutes} минут</b> на каждый тест
          </li>
          <li>
            Допустимо: <b>не больше {MAX_ERRORS} ошибок</b> в каждом тесте
          </li>
          <li>Подсказок нет, результат — только в конце</li>
        </ul>
        <Actions>
          <button className="btn btn-primary w-full" onClick={startTest} data-testid="check-start">Начать</button>
          <button className="btn btn-ghost w-full" onClick={() => router.push('/test')}>Назад к тестам</button>
        </Actions>
      </Screen>
    );
  }

  // ---------------------------------------------------------------- между тестами
  if (phase === 'between') {
    return (
      <Screen>
        <CheckCircle2 size={56} className="text-brand-500" />
        <h1 className="mt-4 text-xl font-bold" data-testid="check-between">
          Тест {finished} из {tests.length} завершён
        </h1>
        <p className="mt-2 max-w-xs text-slate-500">
          {finished >= tests.length
            ? 'Не удалось отправить результат. Ответы сохранены.'
            : `Результат покажем в самом конце. Следующий тест — ${minutes} минут, таймер запустится после нажатия.`}
        </p>
        {err && <p className="mt-3 max-w-xs text-sm text-red-600" role="alert">{err}</p>}
        <Actions>
          {finished >= tests.length ? (
            <button className="btn btn-primary w-full" onClick={() => void submit(stored.done)} data-testid="check-resubmit">Отправить результат ещё раз</button>
          ) : (
            <button className="btn btn-primary w-full" onClick={startTest} data-testid="check-next-test">Тест {finished + 1} из {tests.length}</button>
          )}
        </Actions>
      </Screen>
    );
  }

  if (phase === 'submitting') {
    return <Screen><p className="text-slate-500">Проверяем результат…</p></Screen>;
  }

  // ---------------------------------------------------------------- прохождение
  if (phase === 'play') {
    const t = tests[idx];
    return (
      <>
        <Runner
          key={`${runId}:${idx}`}
          questions={t.questions}
          lang={lang}
          onLang={changeLang}
          onFinish={finishTest}
          onExit={() => setAskExit(true)}
          label={`Проверка ${idx + 1}/${tests.length}`}
          persistKey={runnerKey(idx)}
          finishLabel={idx === tests.length - 1 ? 'Завершить проверку' : 'Завершить тест'}
          blind
          deadlineAt={deadline}
          onTimeUp={onTimeUp}
        />
        {askExit && (
          <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" data-testid="check-exit-dialog">
            <div className="w-full max-w-md rounded-t-3xl bg-white p-5 pb-8 shadow-2xl sm:rounded-3xl">
              <h2 className="text-lg font-bold">Выйти из проверки?</h2>
              <p className="mt-1 text-sm text-slate-500">Ответы сохранятся, но таймер теста продолжит идти. Набор тестов не изменится.</p>
              <div className="mt-5 space-y-2.5">
                <button className="btn btn-ghost w-full" onClick={() => setAskExit(false)}>Остаться</button>
                <button className="btn btn-primary w-full" onClick={() => router.push('/test')} data-testid="check-exit">Выйти</button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // ---------------------------------------------------------------- разбор ошибок
  if (phase === 'review') {
    return (
      <Runner
        key="review"
        questions={reviewQs}
        lang={lang}
        onLang={changeLang}
        onFinish={() => setPhase('result')}
        onExit={() => setPhase('result')}
        label="Разбор ошибок"
        finishLabel="Готово"
      />
    );
  }

  // ---------------------------------------------------------------- результат
  if (result) {
    const startReview = () => {
      const wrong = new Set(result.tests.flatMap((t) => t.wrongIds));
      const seen = new Set<string>();
      const qs: PlayerQuestion[] = [];
      for (const t of tests) for (const q of t.questions) if (wrong.has(q.id) && !seen.has(q.id)) (seen.add(q.id), qs.push(q));
      setReviewQs(qs);
      setPhase('review');
    };
    const retry = () => router.refresh(); // страница выдаст новый случайный набор
    return (
      <Screen scroll>
        {result.passed ? (final ? <Trophy size={60} className="text-amber-500" /> : <CheckCircle2 size={60} className="text-green-500" />) : <XCircle size={60} className="text-red-500" />}
        <h1 className="mt-3 text-2xl font-bold" data-testid="check-result-title">
          {result.passed ? (final ? 'Курс пройден!' : 'Проверка сдана') : 'Проверка не сдана'}
        </h1>
        <p className="mt-1.5 max-w-xs text-sm text-slate-500" data-testid="check-result-text">
          {result.passed
            ? final
              ? 'Все тесты и финальная проверка позади. Вы готовы к экзамену.'
              : 'Следующий тест открыт.'
            : `Нужно не больше ${MAX_ERRORS} ошибок в каждом тесте. В следующей попытке тесты будут другими.`}
          {totalErrors > 0 && ' Ошибки добавлены в раздел «Ошибки».'}
        </p>
        <ul className="mt-5 w-full max-w-xs space-y-2" data-testid="check-result-list">
          {result.tests.map((t) => {
            const ok = t.errors <= MAX_ERRORS;
            return (
              <li key={t.category + t.number} className={cn('flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm', ok ? 'border-green-600/40 bg-green-500/10' : 'border-red-500/50 bg-red-500/10')}>
                <span className="text-slate-700">Тест №{t.display}</span>
                <span className={cn('font-semibold', ok ? 'text-green-700' : 'text-red-700')}>
                  {t.errors === 0 ? 'без ошибок' : `${t.errors} ${plural(t.errors, 'ошибка', 'ошибки', 'ошибок')}`}
                </span>
              </li>
            );
          })}
        </ul>
        <Actions>
          {!result.passed && <button className="btn btn-primary w-full" onClick={retry} data-testid="check-retry">Пройти заново</button>}
          {result.passed && <button className="btn btn-primary w-full" onClick={() => router.push('/test')}>К списку тестов</button>}
          {totalErrors > 0 && (
            <button className="btn btn-ghost w-full" onClick={startReview} data-testid="check-review">
              Разобрать ошибки ({new Set(result.tests.flatMap((t) => t.wrongIds)).size})
            </button>
          )}
          {!result.passed && <button className="btn btn-ghost w-full" onClick={() => router.push('/test')}>К списку тестов</button>}
        </Actions>
      </Screen>
    );
  }
  return null;
}

function Screen({ children, scroll }: { children: React.ReactNode; scroll?: boolean }) {
  return (
    <div className={cn('fixed inset-0 z-50 flex flex-col items-center bg-ink px-6 text-center', scroll ? 'overflow-y-auto py-10' : 'justify-center')}>
      {children}
    </div>
  );
}
function Actions({ children }: { children: React.ReactNode }) {
  return <div className="mb-4 mt-8 w-full max-w-xs space-y-3">{children}</div>;
}

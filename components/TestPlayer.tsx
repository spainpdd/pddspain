'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import type { AnswerMap, PlayerQuestion, StudyLang, SubmitResult, TestCategory, TransLang } from '@/lib/types';
import { MAX_ERRORS } from '@/lib/engine';
import { plural } from '@/lib/utils';
import Runner, { clearSaved, type LangState } from './Runner';

interface Props {
  mode: 'test' | 'errors';
  category?: TestCategory;
  testNumber?: number;
  questions: PlayerQuestion[];
  settings: { study: StudyLang; trans: TransLang; auto: boolean };
  nextTest?: number | null;
}

type Phase = 'play' | 'submitting' | 'result' | 'review' | 'reviewSaving' | 'reviewDone' | 'errorsResult';

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Ошибка ${res.status}`);
  return data;
}

export default function TestPlayer({ mode, category, testNumber, questions, settings, nextTest }: Props) {
  const router = useRouter();
  const [lang, setLang] = useState<LangState>({ study: settings.study, trans: settings.trans, showTrans: settings.auto });
  const [phase, setPhase] = useState<Phase>('play');
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [errorsSummary, setErrorsSummary] = useState<{ correct: number; wrong: number; remaining: number } | null>(null);
  const [run, setRun] = useState(0); // меняется при «Пройти заново», чтобы сбросить Runner
  const [err, setErr] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reviewQs, setReviewQs] = useState<PlayerQuestion[]>([]);
  const lastAnswers = useRef<AnswerMap>({});

  const key = mode === 'test' ? `dgt:run:test:${category}:${testNumber}` : undefined;
  const label = mode === 'test' ? `Тест ${testNumber}` : 'Ошибки';

  const changeLang = useCallback((l: LangState) => {
    setLang(l);
    // язык изучения и перевода запоминаем в профиле (без ожидания ответа)
    fetch('/api/me', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ study_lang: l.study, trans_lang: l.trans }) }).catch(() => {});
  }, []);

  const exit = () => router.push(mode === 'test' ? '/test' : '/dashboard');

  const finishMain = useCallback(
    async (answers: AnswerMap) => {
      lastAnswers.current = answers;
      setErr(null);
      setPhase('submitting');
      try {
        if (mode === 'test') {
          const r: SubmitResult = await post(`/api/tests/${category}/${testNumber}/submit`, { answers });
          clearSaved(key);
          setResult(r);
          setPhase('result');
        } else {
          const r = await post('/api/errors/submit', { answers });
          setErrorsSummary(r);
          setPhase('errorsResult');
        }
        // в режиме ошибок страницу не обновляем: новая пачка подгрузится по кнопке «Ещё»
        if (mode === 'test') router.refresh();
      } catch (e: any) {
        setErr(e.message);
        setPhase('play');
      }
    },
    [mode, category, testNumber, key, router],
  );

  const finishReview = useCallback(
    async (answers: AnswerMap) => {
      setPhase('reviewSaving');
      try {
        await post(`/api/tests/${category}/${testNumber}/review`, { answers });
      } catch {
        /* журнал повторного решения не критичен */
      }
      setPhase(result?.passed ? 'reviewDone' : 'result');
      router.refresh();
    },
    [category, testNumber, result, router],
  );

  const startReview = () => {
    if (!result) return;
    const wrong = new Set(result.wrongIds);
    setReviewQs(questions.filter((q) => wrong.has(q.id)));
    setPhase('review');
  };

  const retry = () => {
    clearSaved(key);
    setResult(null);
    setRun((n) => n + 1);
    setPhase('play');
  };

  const goNext = () => router.push(nextTest ? `/test/${category}/${nextTest}` : '/test');

  if (phase === 'play' || phase === 'submitting') {
    return (
      <>
        <Runner
          key={run}
          questions={questions}
          lang={lang}
          onLang={changeLang}
          onFinish={finishMain}
          onExit={exit}
          countErrors={mode === 'test'}
          label={label}
          persistKey={key}
          finishLabel={mode === 'test' ? 'Завершить тест' : 'Готово'}
        />
        {phase === 'submitting' && <Overlay>Проверяем результат…</Overlay>}
        {err && (
          <div className="fixed inset-x-4 top-16 z-[60] mx-auto max-w-lg rounded-xl bg-red-600 px-4 py-3 text-sm text-white" role="alert">
            {err}. Ответы сохранены — нажмите «{mode === 'test' ? 'Завершить тест' : 'Готово'}» ещё раз.
          </div>
        )}
      </>
    );
  }

  if (phase === 'review' || phase === 'reviewSaving') {
    return (
      <>
        <Runner key={`review-${reviewQs.length}`} questions={reviewQs} lang={lang} onLang={changeLang} onFinish={finishReview} onExit={() => setPhase('result')} label="Разбор ошибок" finishLabel="Готово" />
        {phase === 'reviewSaving' && <Overlay>Сохраняем…</Overlay>}
      </>
    );
  }

  if (phase === 'errorsResult' && errorsSummary) {
    const s = errorsSummary;
    return (
      <Screen>
        <div className="text-5xl">{s.wrong === 0 ? '🎉' : '💪'}</div>
        <h1 className="mt-4 text-2xl font-bold">{s.wrong === 0 ? 'Все верно!' : 'Продолжаем разбор'}</h1>
        <p className="mt-2 text-slate-400" data-testid="errors-summary">
          Верно {s.correct} из {s.correct + s.wrong}.{' '}
          {s.remaining > 0 ? `В разделе осталось ${s.remaining} ${plural(s.remaining, 'вопрос', 'вопроса', 'вопросов')}.` : 'Раздел ошибок пуст — так держать!'}
        </p>
        <div className="mt-8 w-full max-w-xs space-y-3">
          {s.remaining > 0 && (
            <button className="btn btn-primary w-full" data-testid="more-errors" onClick={() => { setLoadingMore(true); router.refresh(); }}>
              Ещё {Math.min(5, s.remaining)}
            </button>
          )}
          <button className="btn btn-ghost w-full" onClick={() => router.push('/dashboard')}>На главную</button>
        </div>
        {loadingMore && <Overlay>Загружаем…</Overlay>}
      </Screen>
    );
  }

  if (phase === 'reviewDone' && result) {
    return (
      <Screen>
        <CheckCircle2 size={64} className="text-green-500" />
        <h1 className="mt-4 text-2xl font-bold">Тест {testNumber} сдан</h1>
        <p className="mt-2 max-w-xs text-slate-400">Ошибки сохранены в раздел «Ошибки» — вы вернётесь к ним позже.</p>
        <Actions>
          <button className="btn btn-primary w-full" onClick={goNext}>{nextTest ? `Тест ${nextTest}` : 'К списку тестов'}</button>
          <button className="btn btn-ghost w-full" onClick={() => router.push('/test')}>К списку тестов</button>
        </Actions>
      </Screen>
    );
  }

  if (result) {
    const r = result;
    return (
      <Screen>
        {r.outcome === 'perfect' && <CheckCircle2 size={64} className="text-green-500" />}
        {r.outcome === 'pass_review' && <AlertTriangle size={64} className="text-amber-500" />}
        {r.outcome === 'fail' && <XCircle size={64} className="text-red-500" />}
        <h1 className="mt-4 text-2xl font-bold" data-testid="result-title">
          {r.outcome === 'perfect' && 'Без ошибок!'}
          {r.outcome === 'pass_review' && 'Тест сдан'}
          {r.outcome === 'fail' && 'Слишком много ошибок'}
        </h1>
        <p className="mt-2 max-w-xs text-slate-400" data-testid="result-text">
          {r.outcome === 'perfect' && `Все ${r.total} ответов верны. Следующий тест открыт.`}
          {r.outcome === 'pass_review' && `Ошибок: ${r.errors}. Они уже в разделе «Ошибки» — давайте разберём их прямо сейчас.`}
          {r.outcome === 'fail' && `Ошибок: ${r.errors} из ${r.total}. Чтобы открыть следующий тест, нужно не больше ${MAX_ERRORS}.`}
        </p>
        <Actions>
          {r.outcome === 'perfect' && <button className="btn btn-primary w-full" onClick={goNext}>{nextTest ? `Тест ${nextTest}` : 'К списку тестов'}</button>}
          {r.outcome === 'pass_review' && <button className="btn btn-primary w-full" onClick={startReview}>Решить ошибки ({r.errors})</button>}
          {r.outcome === 'fail' && (
            <>
              <button className="btn btn-primary w-full" onClick={retry}>Пройти заново</button>
              <button className="btn btn-ghost w-full" onClick={startReview}>Разобрать ошибки ({r.errors})</button>
            </>
          )}
          <button className="btn btn-ghost w-full" onClick={() => router.push('/test')}>К списку тестов</button>
        </Actions>
      </Screen>
    );
  }
  return null;
}

function Screen({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink px-6 text-center">{children}</div>;
}
function Actions({ children }: { children: React.ReactNode }) {
  return <div className="mt-8 w-full max-w-xs space-y-3">{children}</div>;
}
function Overlay({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/70 text-white backdrop-blur-sm">{children}</div>;
}

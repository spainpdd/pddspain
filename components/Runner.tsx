'use client';

/**
 * Прохождение последовательности вопросов: вопрос → выбор варианта → пояснение → «Далее».
 * Переводом на RU/HY можно переключаться в любой момент (на текущем вопросе и на следующих).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, Check } from 'lucide-react';
import type { AnswerMap, Choice, Lang, PlayerQuestion, StudyLang, TransLang } from '@/lib/types';
import { CHOICES, choicesOf } from '@/lib/types';
import { DGT_SITE, DGT_SOURCE_NAME } from '@/lib/legal-notes';
import { MAX_ERRORS } from '@/lib/engine';
import ReportButton from './ReportButton';
import { cn, pick } from '@/lib/utils';

export interface LangState {
  study: StudyLang;
  trans: TransLang;
  showTrans: boolean;
}

interface Props {
  questions: PlayerQuestion[];
  lang: LangState;
  onLang: (l: LangState) => void;
  onFinish: (answers: AnswerMap) => void;
  onExit: () => void;
  /** Показывать счётчик ошибок относительно допустимого максимума (режим теста) */
  countErrors?: boolean;
  label?: string;
  /** Ключ localStorage для сохранения хода (обновление страницы не теряет ответы) */
  persistKey?: string;
  finishLabel?: string;
  /** Режим проверки: без подсказок и пояснений, ответ можно поменять до «Далее» */
  blind?: boolean;
  /** Момент (мс, Date.now()), когда время теста выходит; по истечении вызывается onTimeUp с текущими ответами */
  deadlineAt?: number;
  onTimeUp?: (answers: AnswerMap) => void;
}

interface Saved {
  ids: string[];
  answers: AnswerMap;
  idx: number;
}

function loadSaved(key: string | undefined, ids: string[]): Saved | null {
  if (!key) return null;
  try {
    const s = JSON.parse(localStorage.getItem(key) || 'null') as Saved | null;
    if (s && s.ids.length === ids.length && s.ids.every((x, i) => x === ids[i]) && s.idx < ids.length) return s;
  } catch {}
  return null;
}

/** Сохранённые ответы хода (для случая, когда время вышло, пока пользователь был вне экрана) */
export function loadSavedAnswers(key: string): AnswerMap {
  try {
    return (JSON.parse(localStorage.getItem(key) || 'null') as Saved | null)?.answers ?? {};
  } catch {
    return {};
  }
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function clearSaved(key: string | undefined) {
  if (!key) return;
  try {
    localStorage.removeItem(key);
  } catch {}
}

export default function Runner({ questions, lang, onLang, onFinish, onExit, countErrors, label, persistKey, finishLabel, blind, deadlineAt, onTimeUp }: Props) {
  const ids = useMemo(() => questions.map((q) => q.id), [questions]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [idx, setIdx] = useState(0);
  const [ready, setReady] = useState(false);
  const explRef = useRef<HTMLDivElement>(null);
  const answersRef = useRef<AnswerMap>({});
  answersRef.current = answers;
  const firedRef = useRef(false);
  const [now, setNow] = useState(() => Date.now());

  // таймер теста (режим проверки)
  useEffect(() => {
    if (!deadlineAt) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [deadlineAt]);

  // восстановление хода после обновления страницы
  useEffect(() => {
    const s = loadSaved(persistKey, ids);
    if (s) {
      setAnswers(s.answers);
      setIdx(s.idx);
    }
    setReady(true);
  }, [persistKey, ids]);

  useEffect(() => {
    if (!ready || !persistKey) return;
    try {
      localStorage.setItem(persistKey, JSON.stringify({ ids, answers, idx } satisfies Saved));
    } catch {}
  }, [ready, persistKey, ids, answers, idx]);

  const q = questions[idx];
  const chosen = q ? answers[q.id] : undefined;
  const last = idx === questions.length - 1;
  const wrongSoFar = questions.filter((x) => answers[x.id] && answers[x.id] !== x.correct).length;

  const choose = useCallback(
    (c: Choice) => {
      if (!q || (!blind && answers[q.id]) || !choicesOf(q).includes(c)) return;
      setAnswers((a) => ({ ...a, [q.id]: c }));
      if (!blind) setTimeout(() => explRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
    },
    [q, answers, blind],
  );

  // время вышло — завершаем текущий тест с тем, что успели ответить
  useEffect(() => {
    if (!deadlineAt || !ready || firedRef.current || now < deadlineAt) return;
    firedRef.current = true;
    onTimeUp?.(answersRef.current);
  }, [deadlineAt, ready, now, onTimeUp]);

  const next = useCallback(() => {
    if (!q || !answers[q.id]) return;
    if (last) onFinish(answers);
    else setIdx((i) => i + 1);
  }, [q, answers, last, onFinish]);

  // клавиатура: A/B/C или 1/2/3 — выбрать, Enter/пробел/→ — далее
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      const k = e.key.toLowerCase();
      if (['a', 'b', 'c'].includes(k)) choose(k as Choice);
      else if (['1', '2', '3'].includes(k)) choose(CHOICES[Number(k) - 1]);
      else if (k === 'enter' || k === ' ' || k === 'arrowright') {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [choose, next]);

  if (!q) return null;

  const study = pick(q, lang.study);
  const trans: Lang = lang.trans;
  const tr = lang.showTrans ? q.i18n[trans] ?? null : null;
  const missingTr = lang.showTrans && !q.i18n[trans];
  const pct = ((idx + (chosen ? 1 : 0)) / questions.length) * 100;
  const remaining = deadlineAt ? Math.max(0, deadlineAt - now) : null;

  const chip = (active: boolean) =>
    cn('chip', active ? 'bg-brand-600 text-white' : 'bg-white text-slate-500 hover:text-slate-900');

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink" data-testid="runner">
      {/* верхняя панель */}
      <div className="pt-safe px-4">
        <div className="mx-auto flex max-w-lg items-center gap-3 pb-2">
          <button onClick={onExit} aria-label="Выйти" className="-ml-1 rounded-full p-1.5 text-slate-400 hover:text-slate-900">
            <X size={22} />
          </button>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-brand-500 transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs tabular-nums text-slate-400" data-testid="counter">
            {idx + 1} / {questions.length}
          </span>
        </div>
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2 pb-3">
          <div className="flex items-center gap-1.5">
            <div className="flex gap-1 rounded-full bg-slate-100 p-0.5">
              {(['es', 'en'] as StudyLang[]).map((l) => (
                <button key={l} className={chip(lang.study === l)} onClick={() => onLang({ ...lang, study: l })} data-testid={`study-${l}`}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <span className="text-slate-400">→</span>
            <div className="flex gap-1 rounded-full bg-slate-100 p-0.5">
              {(['ru', 'hy'] as TransLang[]).map((l) => {
                const active = lang.showTrans && lang.trans === l;
                return (
                  <button
                    key={l}
                    className={chip(active)}
                    onClick={() => onLang(active ? { ...lang, showTrans: false } : { ...lang, trans: l, showTrans: true })}
                    aria-pressed={active}
                    data-testid={`trans-${l}`}
                  >
                    {l.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {label && <span className="text-slate-500">{label}</span>}
            {remaining !== null && (
              <span className={cn('rounded-full px-2 py-1 font-semibold tabular-nums', remaining < 5 * 60_000 ? 'bg-red-500/15 text-red-700' : 'bg-slate-100 text-slate-600')} data-testid="timer">
                {formatClock(remaining)}
              </span>
            )}
            {countErrors && !blind && (
              <span className={cn('rounded-full px-2 py-1 font-semibold', wrongSoFar > MAX_ERRORS ? 'bg-red-500/15 text-red-700' : wrongSoFar ? 'bg-amber-500/15 text-amber-700' : 'bg-slate-100 text-slate-500')} data-testid="err-chip">
                Ошибок: {wrongSoFar}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* вопрос */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="mx-auto max-w-lg pb-28" key={q.id}>
          {q.image_url && (
            <div className="mb-4 overflow-hidden rounded-2xl bg-white/95 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={q.image_url} alt="" className="mx-auto max-h-56 w-auto object-contain" />
            </div>
          )}

          <div className="rise">
            <p className="text-question font-medium" data-testid="q-text">{study?.text}</p>
            {tr && <p className="mt-2 text-[0.95rem] leading-relaxed text-brand-600" data-testid="q-text-tr">{tr.text}</p>}
            {missingTr && <p className="mt-2 text-xs text-slate-500">Перевода на {trans.toUpperCase()} пока нет — показан оригинал.</p>}
          </div>

          <div className="mt-5 space-y-2.5">
            {choicesOf(q).map((c) => {
              const isChosen = chosen === c;
              const isRight = q.correct === c;
              const done = !!chosen && !blind;
              const picked = blind && isChosen;
              return (
                <button
                  key={c}
                  onClick={() => choose(c)}
                  disabled={done}
                  data-testid={`opt-${c}`}
                  data-state={done ? (isRight ? 'right' : isChosen ? 'wrong' : 'idle') : 'idle'}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-2xl border-2 px-3.5 py-3.5 text-left transition active:scale-[0.99]',
                    !done && !picked && 'border-slate-200 bg-ink-900 hover:border-brand-500',
                    picked && 'border-brand-500 bg-brand-500/10',
                    done && isRight && 'border-green-500 bg-green-500/15',
                    done && isChosen && !isRight && 'border-red-500 bg-red-500/15',
                    done && !isChosen && !isRight && 'border-slate-200/70 bg-ink-900/40 opacity-60',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                      done && isRight ? 'bg-green-500 text-white' : done && isChosen ? 'bg-red-500 text-white' : picked ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-500',
                    )}
                  >
                    {done && isRight ? <Check size={16} strokeWidth={3} /> : c.toUpperCase()}
                  </span>
                  <span className="flex-1">
                    <span className="block text-[0.98rem] leading-snug">{study?.[c]}</span>
                    {tr && <span className="mt-1 block text-sm leading-snug text-brand-600" data-testid={`opt-${c}-tr`}>{tr[c]}</span>}
                  </span>
                </button>
              );
            })}
          </div>

          {q.official && !blind && (
            <p className="mt-4 text-[11px] leading-snug text-slate-500" data-testid="source-dgt">
              Fuente: {DGT_SOURCE_NAME} ·{' '}
              <a href={DGT_SITE} target="_blank" rel="noopener noreferrer" className="underline">sede.dgt.gob.es</a>
              . Перевод неофициальный.
            </p>
          )}

          {/* пояснение открывается сразу после выбора ответа */}
          {chosen && !blind && (
            <div ref={explRef} className="rise mt-5 rounded-2xl border border-slate-200 bg-ink-800 p-4" data-testid="explanation">
              <p className={cn('mb-1.5 text-sm font-semibold', chosen === q.correct ? 'text-green-600' : 'text-red-600')}>
                {chosen === q.correct ? 'Верно' : `Неверно · правильный ответ ${q.correct.toUpperCase()}`}
              </p>
              {study?.explanation ? (
                <p className="text-sm leading-relaxed text-slate-700">{study.explanation}</p>
              ) : (
                !tr?.explanation && <p className="text-sm text-slate-500">Для этого вопроса пояснение пока не добавлено.</p>
              )}
              {tr?.explanation && <p className="mt-2 text-sm leading-relaxed text-brand-600" data-testid="explanation-tr">{tr.explanation}</p>}
            </div>
          )}
          {chosen && !blind && <ReportButton key={q.id} questionId={q.id} lang={lang.study} />}
        </div>
      </div>

      {/* «Далее» */}
      <div className="border-t border-slate-200 bg-ink/95 px-4 pb-safe pt-3 backdrop-blur">
        <div className="mx-auto max-w-lg">
          <button className="btn btn-primary w-full" disabled={!chosen} onClick={next} data-testid="next">
            {last ? finishLabel ?? 'Завершить' : 'Далее'}
          </button>
        </div>
      </div>
    </div>
  );
}

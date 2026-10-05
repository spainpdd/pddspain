import { notFound, redirect } from 'next/navigation';
import { accessInfo, requireUser } from '@/lib/auth';
import { getCourse, getTestQuestions } from '@/lib/repo/content';
import { registerFreeAccess } from '@/lib/repo/progress';
import { canOpenTest } from '@/lib/engine';
import { TEST_CATEGORIES, type TestCategory } from '@/lib/types';
import TestPlayer from '@/components/TestPlayer';

export const dynamic = 'force-dynamic';

export default async function TestPage({ params }: { params: { category: string; n: string } }) {
  const user = await requireUser();
  const category = params.category as TestCategory;
  if (!TEST_CATEGORIES.includes(category)) notFound();
  const n = Number(params.n);
  if (!Number.isInteger(n) || n < 1) notFound();

  const { tests, checkpoints } = await getCourse(user.id);
  const item = tests.find((t) => t.category === category && t.number === n);
  if (!item) notFound();
  if (item.status === 'locked') redirect('/test');
  const acc = await accessInfo(user);
  if (!canOpenTest(item, acc)) redirect('/pay');
  await registerFreeAccess(user.id, item, acc);

  const questions = await getTestQuestions(category, n);
  if (!questions.length) notFound();

  // что идёт после этого теста: проверка (если стоит здесь и ещё не сдана) или следующий тест курса
  const check = checkpoints.find((c) => c.milestone === item.display);
  const nxt = tests[item.display]; // следующий по сквозному номеру
  const after = check && check.status !== 'passed'
    ? { kind: 'check' as const, milestone: check.milestone, final: check.kind === 'final' }
    : nxt
      ? { kind: 'test' as const, category: nxt.category, number: nxt.number, display: nxt.display }
      : null;

  return (
    <TestPlayer
      mode="test"
      category={category}
      testNumber={n}
      questions={questions}
      settings={{ study: user.study_lang, trans: user.trans_lang, auto: user.auto_translate }}
      displayNumber={item.display}
      after={after}
    />
  );
}

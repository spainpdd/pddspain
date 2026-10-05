import { notFound, redirect } from 'next/navigation';
import { accessInfo, requireUser } from '@/lib/auth';
import { getTestQuestions, listTests } from '@/lib/repo/content';
import { registerFreeAccess } from '@/lib/repo/progress';
import { canOpenTest, orderTests } from '@/lib/engine';
import { TEST_CATEGORIES, type TestCategory } from '@/lib/types';
import TestPlayer from '@/components/TestPlayer';

export const dynamic = 'force-dynamic';

export default async function TestPage({ params }: { params: { category: string; n: string } }) {
  const user = await requireUser();
  const category = params.category as TestCategory;
  if (!TEST_CATEGORIES.includes(category)) notFound();
  const n = Number(params.n);
  if (!Number.isInteger(n) || n < 1) notFound();

  const tests = await listTests(user.id);
  const item = tests.find((t) => t.category === category && t.number === n);
  if (!item) notFound();
  if (item.status === 'locked') redirect('/test');
  const acc = await accessInfo(user);
  if (!canOpenTest(category, n, acc)) redirect('/pay');
  await registerFreeAccess(user.id, category, n, acc);

  const questions = await getTestQuestions(category, n);
  if (!questions.length) notFound();

  // сквозная нумерация единого списка тестов (см. orderTests)
  const ordered = orderTests(tests);
  const idx = ordered.findIndex((t) => t.category === category && t.number === n);
  const nxt = idx >= 0 ? ordered[idx + 1] : undefined;

  return (
    <TestPlayer
      mode="test"
      category={category}
      testNumber={n}
      questions={questions}
      settings={{ study: user.study_lang, trans: user.trans_lang, auto: user.auto_translate }}
      displayNumber={idx >= 0 ? ordered[idx].display : n}
      nextTest={nxt ? { category: nxt.category, number: nxt.number, display: nxt.display } : null}
    />
  );
}

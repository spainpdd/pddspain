import { notFound, redirect } from 'next/navigation';
import { accessInfo, requireUser } from '@/lib/auth';
import { canOpenCheckpoint, CHECK_MINUTES } from '@/lib/engine';
import { getOrStartCheckpoint, loadRunQuestions } from '@/lib/repo/checkpoints';
import { RuleError } from '@/lib/repo/progress';
import CheckPlayer from '@/components/CheckPlayer';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Проверка' };

export default async function CheckpointPage({ params }: { params: { milestone: string } }) {
  const user = await requireUser();
  const milestone = Number(params.milestone);
  if (!Number.isInteger(milestone) || milestone < 1) notFound();
  const acc = await accessInfo(user);
  if (!canOpenCheckpoint(milestone, acc.paid)) redirect('/pay');

  let run;
  try {
    run = await getOrStartCheckpoint(user.id, milestone);
  } catch (e) {
    if (e instanceof RuleError) redirect('/test');
    throw e;
  }
  const tests = await loadRunQuestions(run);
  if (!tests.some((t) => t.questions.length)) redirect('/test');

  return (
    <CheckPlayer
      key={run.id}
      runId={run.id}
      milestone={milestone}
      final={run.kind === 'final'}
      tests={tests}
      minutes={CHECK_MINUTES}
      settings={{ study: user.study_lang, trans: user.trans_lang, auto: user.auto_translate }}
    />
  );
}

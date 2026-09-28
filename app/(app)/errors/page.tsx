import Link from 'next/link';
import { Lock } from 'lucide-react';
import { accessInfo, requireUser } from '@/lib/auth';
import { getErrorBatch } from '@/lib/repo/progress';
import TestPlayer from '@/components/TestPlayer';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Ошибки' };

export default async function ErrorsPage() {
  const user = await requireUser();
  const acc = accessInfo(user);

  if (!acc.paid) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Ошибки</h1>
        <div className="card mt-6 p-6 text-center">
          <Lock className="mx-auto mb-3 text-slate-500" />
          <p className="text-slate-300">Раздел ошибок доступен с подпиской.</p>
          <p className="mt-1 text-sm text-slate-500">Каждый неверный ответ запоминается, а система выдаёт их пачками по 5.</p>
          <Link href="/pay" className="btn btn-primary mt-5">Открыть доступ</Link>
        </div>
      </div>
    );
  }

  const batch = await getErrorBatch(user.id);
  if (!batch.length) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Ошибки</h1>
        <div className="card mt-6 p-6 text-center" data-testid="errors-empty">
          <div className="text-4xl">✨</div>
          <p className="mt-3 text-slate-300">Ошибок пока нет.</p>
          <p className="mt-1 text-sm text-slate-500">Как только вы неверно ответите на вопрос, он появится здесь.</p>
          <Link href="/test" className="btn btn-primary mt-5">К тестам</Link>
        </div>
      </div>
    );
  }

  return (
    <TestPlayer
      key={`${batch.map((q) => q.id).join('')}:${Date.now()}`}
      mode="errors"
      questions={batch}
      settings={{ study: user.study_lang, trans: user.trans_lang, auto: user.auto_translate }}
    />
  );
}

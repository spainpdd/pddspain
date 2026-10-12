import Link from 'next/link';
import { Lock } from 'lucide-react';
import { accessInfo, requireUser } from '@/lib/auth';
import { getErrorBatch } from '@/lib/repo/progress';
import { errorTotals } from '@/lib/repo/users';
import TestPlayer from '@/components/TestPlayer';

/** 1 вопрос, 2–4 вопроса, 5+ вопросов */
function pluralQuestions(n: number): string {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return `${n} вопрос`;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return `${n} вопроса`;
  return `${n} вопросов`;
}

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Ошибки' };

export default async function ErrorsPage() {
  const user = await requireUser();
  const acc = await accessInfo(user);

  if (!acc.paid) {
    const { questions } = await errorTotals(user.id);
    return (
      <div>
        <h1 className="text-2xl font-bold">Ошибки</h1>
        <div className="card mt-6 p-6 text-center" data-testid="errors-locked">
          <Lock className="mx-auto mb-3 text-slate-500" />
          {questions > 0 ? (
            <>
              <p className="text-4xl font-bold text-red-500" data-testid="errors-count">{questions}</p>
              <p className="mt-1 text-slate-700">На разбор ждёт: {pluralQuestions(questions)}</p>
              <p className="mt-2 text-sm text-slate-500">Они сохранены. Прорешать их можно с подпиской: система выдаёт ошибки пачками по 5 и возвращает, пока вы не ответите верно.</p>
            </>
          ) : (
            <>
              <p className="text-slate-700">Раздел ошибок открывается с подпиской.</p>
              <p className="mt-1 text-sm text-slate-500">Каждый неверный ответ запоминается. Они копятся здесь, а разобрать их можно после оформления подписки: система выдаёт ошибки пачками по 5.</p>
            </>
          )}
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
          <p className="mt-3 text-slate-700">Ошибок пока нет.</p>
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

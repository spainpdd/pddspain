import Link from 'next/link';
import { ArrowRight, Lock } from 'lucide-react';
import { accessInfo, requireUser } from '@/lib/auth';
import { getStats } from '@/lib/repo/users';
import { listTests } from '@/lib/repo/content';
import { TEST_COUNT, currentTest, canOpenTest } from '@/lib/engine';
import InstallHint from '@/components/InstallHint';
import { formatDate, plural } from '@/lib/utils';

export const metadata = { title: 'Главная' };

export default async function DashboardPage() {
  const user = await requireUser();
  const [stats, tests] = await Promise.all([getStats(user.id), listTests(user.id)]);
  const acc = accessInfo(user);
  const officialTests = tests.filter((t) => t.category === 'official');
  const passed = officialTests.filter((t) => t.status === 'passed').length;
  const total = Math.max(officialTests.length, 1);
  const cur = currentTest(tests);
  const curAllowed = cur ? canOpenTest('official', cur, acc.paid, acc.freeTests) : true;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Привет, {user.display_name?.split(' ')[0] ?? 'друг'}</h1>
          <p className="text-sm text-slate-400">
            {stats.today_answers
              ? `Сегодня: ${stats.today_answers} ${plural(stats.today_answers, 'ответ', 'ответа', 'ответов')}, верно ${stats.today_correct}`
              : 'Сегодня ещё не занимались'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat value={stats.total_answers} label="Всего ответов" tone="text-brand-400" testid="stat-answers" />
        <Stat value={`${stats.accuracy}%`} label="Точность" tone="text-green-400" />
        <Stat value={`${passed}/${officialTests.length || TEST_COUNT}`} label="Тестов сдано" tone="text-amber-400" />
      </div>

      <div className="mt-6">
        <div className="mb-2 flex justify-between text-xs text-slate-400">
          <span>Прогресс</span>
          <span>{Math.round((passed / total) * 100)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-brand-500" style={{ width: `${(passed / total) * 100}%` }} />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {officialTests.length === 0 ? (
          <div className="card p-5 text-sm text-slate-400">Тесты ещё не добавлены. Загляните позже.</div>
        ) : cur ? (
          curAllowed ? (
            <Link href={`/test/official/${cur}`} className="btn btn-primary w-full text-lg" data-testid="cta-continue">
              {passed ? `Продолжить: тест ${cur}` : `Начать: тест ${cur}`} <ArrowRight size={20} />
            </Link>
          ) : (
            <Link href="/pay" className="btn btn-primary w-full text-lg">
              <Lock size={18} /> Открыть все тесты
            </Link>
          )
        ) : (
          <div className="card p-5 text-center text-green-400">Все доступные тесты сданы 🎉</div>
        )}

        <Link href="/errors" className="card flex items-center justify-between p-4 hover:bg-ink-800" data-testid="link-errors">
          <div>
            <div className="font-medium">Раздел ошибок</div>
            <div className="text-xs text-slate-400">По 5 вопросов, в которых вы ошибались</div>
          </div>
          <span className={stats.errors_open ? 'rounded-full bg-red-500/15 px-3 py-1 text-sm font-semibold text-red-300' : 'text-sm text-slate-500'}>
            {stats.errors_open}
          </span>
        </Link>
      </div>

      <div className="card mt-6 p-4 text-sm">
        {acc.paid ? (
          <p className="text-slate-300">
            Доступ открыт до <b>{formatDate(user.access_until)}</b>{' '}
            <span className="text-slate-500">
              (осталось {acc.daysLeft} {plural(acc.daysLeft, 'день', 'дня', 'дней')})
            </span>
          </p>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-slate-400">
              Бесплатно доступно {acc.freeTests > 0 ? `тестов: ${acc.freeTests}` : 'демо'}. Полный доступ — 50 € на 100 дней.
            </p>
            <Link href="/pay" className="btn btn-primary btn-sm shrink-0">
              Открыть
            </Link>
          </div>
        )}
      </div>

      <InstallHint />
    </div>
  );
}

function Stat({ value, label, tone, testid }: { value: string | number; label: string; tone: string; testid?: string }) {
  return (
    <div className="card p-3.5 text-center">
      <div className={`text-2xl font-bold ${tone}`} data-testid={testid}>
        {value}
      </div>
      <div className="mt-0.5 text-[11px] leading-tight text-slate-400">{label}</div>
    </div>
  );
}

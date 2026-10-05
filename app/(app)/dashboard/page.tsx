import Link from 'next/link';
import { ArrowRight, Lock } from 'lucide-react';
import { accessInfo, requireUser } from '@/lib/auth';
import { getStats } from '@/lib/repo/users';
import { listTests } from '@/lib/repo/content';
import { getPricing } from '@/lib/repo/config';
import { TEST_COUNT, currentTest, canOpenTest, readinessPercent } from '@/lib/engine';
import InstallHint from '@/components/InstallHint';
import StatsModal from '@/components/StatsModal';
import { formatDate, formatPrice, plural } from '@/lib/utils';

export const metadata = { title: 'Главная' };

export default async function DashboardPage() {
  const user = await requireUser();
  const [stats, tests, acc, pricing] = await Promise.all([getStats(user.id), listTests(user.id), accessInfo(user), getPricing()]);
  const officialTests = tests.filter((t) => t.category === 'official');
  const passed = officialTests.filter((t) => t.status === 'passed').length;
  const total = Math.max(officialTests.length, TEST_COUNT);
  const cur = currentTest(tests);
  const curAllowed = cur ? canOpenTest('official', cur, acc) : true;
  const readiness = readinessPercent(passed, total);
  const priceText = formatPrice(pricing, user.trans_lang);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Привет, {user.display_name?.split(' ')[0] ?? 'друг'}</h1>
          <p className="text-sm text-slate-400">
            {stats.today_answers
              ? `Сегодня: ${stats.today_answers} ${plural(stats.today_answers, 'ответ', 'ответа', 'ответов')}, верно ${stats.today_correct}`
              : 'Сегодня ещё не занимались'}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <StatsModal stats={stats} readiness={readiness} passedTests={passed} totalTests={total} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat value={stats.total_answers} label="Всего ответов" tone="text-brand-400" testid="stat-answers" />
        <Stat value={`${stats.accuracy}%`} label="Точность" tone="text-green-600" />
        <Stat value={`${passed}/${total}`} label="Тестов сдано" tone="text-amber-600" />
      </div>

      <div className="mt-6">
        <div className="mb-2 flex justify-between text-xs text-slate-400">
          <span>Прогресс</span>
          <span>{readiness}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
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
          <div className="card p-5 text-center text-green-600">Все доступные тесты сданы 🎉</div>
        )}

        <Link href="/errors" className="card flex items-center justify-between p-4 hover:bg-ink-800" data-testid="link-errors">
          <div>
            <div className="font-medium">Раздел ошибок</div>
            <div className="text-xs text-slate-400">По 5 вопросов, в которых вы ошибались</div>
          </div>
          <span className={stats.errors_open ? 'rounded-full bg-red-500/15 px-3 py-1 text-sm font-semibold text-red-700' : 'text-sm text-slate-500'}>
            {stats.errors_open}
          </span>
        </Link>
      </div>

      <div className="card mt-6 p-4 text-sm">
        {acc.paid ? (
          <p className="text-slate-700">
            Доступ открыт до <b>{formatDate(user.access_until)}</b>{' '}
            <span className="text-slate-500">
              (осталось {acc.daysLeft} {plural(acc.daysLeft, 'день', 'дня', 'дней')})
            </span>
          </p>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-slate-400">
              Бесплатно: 1 тест в день (из первых 20). Полный доступ — {priceText} на 100 дней.
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

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { env } from '@/lib/env';
import TelegramLoginButton from '@/components/TelegramLoginButton';
import TelegramBotLoginButton from '@/components/TelegramBotLoginButton';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Вход' };

const ERRORS: Record<string, string> = {
  bad_hash: 'Не удалось проверить вход через Telegram. Попробуйте ещё раз.',
  expired: 'Вход устарел. Попробуйте ещё раз.',
  no_token: 'Вход через Telegram не настроен на сервере (нет токена бота).',
  no_hash: 'Не удалось проверить вход через Telegram. Попробуйте ещё раз.',
  bad_data: 'Не удалось проверить вход через Telegram. Попробуйте ещё раз.',
};

export default async function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  if (await getSessionUser()) redirect('/dashboard');
  const bot = env.botUsername;
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center px-6 text-center">
      <div className="text-5xl">🚦</div>
      <h1 className="mt-4 text-2xl font-bold">Вход</h1>
      <p className="mt-2 text-sm text-slate-400">Войдите через Telegram — так мы сохраним ваш прогресс и будем присылать «вопрос дня».</p>

      <div className="mt-8 w-full">
        {bot ? (
          <>
            <TelegramBotLoginButton />
            <details className="mt-6 text-left">
              <summary className="cursor-pointer select-none text-center text-sm text-slate-500 underline">
                Не работает? Войти через браузер
              </summary>
              <div className="mt-4">
                <TelegramLoginButton bot={bot} />
              </div>
            </details>
          </>
        ) : (
          <p className="rounded-xl border border-amber-400/50 bg-amber-50 p-3 text-sm text-amber-700">
            Не задан NEXT_PUBLIC_TELEGRAM_BOT_USERNAME — кнопка Telegram недоступна.
          </p>
        )}
      </div>

      {searchParams.error && <p className="mt-4 text-sm text-red-600" role="alert">{ERRORS[searchParams.error] ?? 'Ошибка входа.'}</p>}

      {env.devLogin && (
        <form action="/api/auth/dev" method="post" className="mt-8 w-full space-y-2 rounded-2xl border border-dashed border-slate-300 p-4 text-left">
          <p className="text-xs text-amber-600">Режим разработчика (ENABLE_DEV_LOGIN)</p>
          <input name="name" defaultValue="Dev User" className="input" aria-label="Имя" />
          <input name="id" defaultValue="9001" className="input" aria-label="Telegram ID" inputMode="numeric" />
          <button className="btn btn-ghost btn-sm w-full" data-testid="dev-login">Войти как разработчик</button>
        </form>
      )}

      <Link href="/" className="mt-10 text-sm text-slate-500 underline">На главную</Link>
    </main>
  );
}

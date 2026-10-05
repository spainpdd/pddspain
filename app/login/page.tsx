import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { env } from '@/lib/env';
import TelegramLoginButton from '@/components/TelegramLoginButton';
import TelegramBotLoginButton from '@/components/TelegramBotLoginButton';
import LangSwitcher from '@/components/LangSwitcher';
import { getSiteLang } from '@/lib/site-lang';
import { LOGIN } from '@/lib/site-i18n';

export const dynamic = 'force-dynamic';
export function generateMetadata() {
  return { title: LOGIN[getSiteLang()].title };
}

export default async function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  if (await getSessionUser()) redirect('/dashboard');
  const bot = env.botUsername;
  const lang = getSiteLang();
  const t = LOGIN[lang];
  const ERRORS: Record<string, string> = {
    bad_hash: t.errBad,
    expired: t.errExpired,
    no_token: t.errNoToken,
    no_hash: t.errBad,
    bad_data: t.errBad,
  };
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center px-6 text-center" lang={lang}>
      <div className="mb-6">
        <LangSwitcher current={lang} />
      </div>
      <div className="text-5xl">🚦</div>
      <h1 className="mt-4 text-2xl font-bold">{t.title}</h1>
      <p className="mt-2 text-sm text-slate-400">{t.lead}</p>

      <div className="mt-8 w-full">
        {bot ? (
          <>
            <TelegramBotLoginButton lang={lang} />
            <details className="mt-6 text-left">
              <summary className="cursor-pointer select-none text-center text-sm text-slate-500 underline">
                {t.fallback}
              </summary>
              <div className="mt-4">
                <TelegramLoginButton bot={bot} />
              </div>
            </details>
          </>
        ) : (
          <p className="rounded-xl border border-amber-400/50 bg-amber-50 p-3 text-sm text-amber-700">
            {t.noBot}
          </p>
        )}
      </div>

      {searchParams.error && <p className="mt-4 text-sm text-red-600" role="alert">{ERRORS[searchParams.error] ?? t.errGeneric}</p>}

      {env.devLogin && (
        <form action="/api/auth/dev" method="post" className="mt-8 w-full space-y-2 rounded-2xl border border-dashed border-slate-300 p-4 text-left">
          <p className="text-xs text-amber-600">Режим разработчика (ENABLE_DEV_LOGIN)</p>
          <input name="name" defaultValue="Dev User" className="input" aria-label="Имя" />
          <input name="id" defaultValue="9001" className="input" aria-label="Telegram ID" inputMode="numeric" />
          <button className="btn btn-ghost btn-sm w-full" data-testid="dev-login">Войти как разработчик</button>
        </form>
      )}

      <Link href="/" className="mt-10 text-sm text-slate-500 underline">{t.home}</Link>
    </main>
  );
}

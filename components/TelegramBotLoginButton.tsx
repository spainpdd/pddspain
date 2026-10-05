'use client';

import { useEffect, useRef, useState } from 'react';
import { LOGIN, type SiteLang } from '@/lib/site-i18n';

/**
 * Вход через Telegram-бота напрямую: t.me/<bot>?start=login_<token> вместо
 * официального Login Widget. Решает проблему iOS Safari, где widget (встроен
 * в iframe) часто не может открыть приложение и откатывается на веб-форму
 * с номером телефона — здесь обычная ссылка, ОС сама открывает Telegram.
 */

type Status = 'idle' | 'starting' | 'waiting' | 'confirmed' | 'error' | 'timeout';

const POLL_MS = 2000;
const TIMEOUT_MS = 9 * 60 * 1000; // чуть меньше TTL тикета на сервере (10 мин, см. lib/repo/login-tickets.ts)

export default function TelegramBotLoginButton({ lang = 'ru' }: { lang?: SiteLang }) {
  const t = LOGIN[lang].tg;
  const [status, setStatus] = useState<Status>('idle');
  const [botUrl, setBotUrl] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const deadlineRef = useRef<number>(0);

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
  };
  useEffect(() => stopPolling, []);

  async function start() {
    setStatus('starting');
    try {
      const res = await fetch('/api/auth/telegram/ticket', { method: 'POST' });
      if (!res.ok) throw new Error('ticket');
      const { token, botUrl: url } = await res.json();
      setBotUrl(url);
      setStatus('waiting');
      window.location.href = url; // прямой переход — на телефоне открывает приложение Telegram

      deadlineRef.current = Date.now() + TIMEOUT_MS;
      pollRef.current = setInterval(async () => {
        if (Date.now() > deadlineRef.current) {
          stopPolling();
          setStatus('timeout');
          return;
        }
        try {
          const r = await fetch(`/api/auth/telegram/ticket/${token}`, { cache: 'no-store' });
          const j = await r.json();
          if (j.status === 'confirmed') {
            stopPolling();
            setStatus('confirmed');
            window.location.href = '/dashboard';
          } else if (j.status === 'expired') {
            stopPolling();
            setStatus('timeout');
          }
        } catch {
          // сетевой сбой — молча продолжаем, следующая попытка через POLL_MS
        }
      }, POLL_MS);
    } catch {
      setStatus('error');
    }
  }

  if (status === 'waiting' || status === 'confirmed') {
    return (
      <div className="flex flex-col items-center gap-3">
        <button className="btn btn-primary w-full" disabled data-testid="tg-bot-login">
          <TgIcon /> {t.waiting}
        </button>
        <p className="text-xs text-slate-500">
          {t.notOpened}{' '}
          <a className="underline" href={botUrl ?? '#'}>
            {t.clickHere}
          </a>
          .
        </p>
      </div>
    );
  }

  if (status === 'timeout' || status === 'error') {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-amber-700">
          {status === 'timeout' ? t.timeout : t.failed}
        </p>
        <button className="btn btn-primary w-full" onClick={start} data-testid="tg-bot-login">
          <TgIcon /> {t.retry}
        </button>
      </div>
    );
  }

  return (
    <button className="btn btn-primary w-full" onClick={start} disabled={status === 'starting'} data-testid="tg-bot-login">
      <TgIcon /> {t.signIn}
    </button>
  );
}

function TgIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false">
      <path d="M21.94 4.6 18.6 20.18c-.25 1.12-.9 1.4-1.83.87l-5.06-3.73-2.44 2.35c-.27.27-.5.5-1.02.5l.36-5.16 9.4-8.5c.41-.36-.09-.56-.63-.2L6.3 13.02 1.26 11.44c-1.1-.34-1.11-1.1.23-1.63L20.56 3.4c.9-.33 1.7.22 1.38 1.2Z" />
    </svg>
  );
}

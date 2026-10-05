'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { COOKIE, normalizeLang, type SiteLang } from '@/lib/site-i18n';

const KEY = 'cookie_notice';

function readLang(): SiteLang {
  try {
    const m = document.cookie.match(/(?:^|;\s*)site_lang=([^;]+)/);
    return normalizeLang(m?.[1]) ?? (navigator.language?.toLowerCase().startsWith('hy') ? 'hy' : 'ru');
  } catch {
    return 'ru';
  }
}

/**
 * Уведомление об использовании cookie. Мы ставим только технические cookie, поэтому согласие
 * не запрашивается — баннер информирует и запоминает, что пользователь его видел.
 */
export default function CookieBanner() {
  const [show, setShow] = useState(false);
  const [lang, setLang] = useState<SiteLang>('ru');

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY)) return;
    } catch {
      // память браузера недоступна — просто покажем баннер
    }
    setLang(readLang());
    setShow(true);
  }, []);

  if (!show) return null;
  const t = COOKIE[lang];
  const close = () => {
    try {
      localStorage.setItem(KEY, '1');
    } catch {}
    setShow(false);
  };

  return (
    <div
      role="region"
      aria-label="Cookie"
      className="fixed inset-x-3 bottom-3 z-[80] mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-600 shadow-xl"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      data-testid="cookie-banner"
    >
      <p>
        {t.text}{' '}
        <Link href="/legal/privacy#cookies" className="underline">{t.more}</Link>
      </p>
      <button type="button" onClick={close} className="btn btn-primary btn-sm mt-3 w-full" data-testid="cookie-ok">
        {t.ok}
      </button>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Globe } from 'lucide-react';
import { SITE_LANG_COOKIE, type SiteLang } from '@/lib/site-i18n';
import { cn } from '@/lib/utils';

const OPTIONS: { code: SiteLang; label: string; title: string }[] = [
  { code: 'ru', label: 'RU', title: 'Русский' },
  { code: 'hy', label: 'ՀԱՅ', title: 'Հայերեն' },
];

/** Компактный переключатель языка публичных страниц: пилюля с глобусом и двумя вариантами */
export default function LangSwitcher({ current }: { current: SiteLang }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function pick(code: SiteLang) {
    if (code === current) return;
    document.cookie = `${SITE_LANG_COOKIE}=${code}; path=/; max-age=31536000; SameSite=Lax`;
    start(() => router.refresh());
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className={cn('inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm', pending && 'opacity-70')}
      data-testid="lang-switcher"
    >
      <Globe size={15} className="ml-1.5 text-slate-400" aria-hidden />
      {OPTIONS.map((o) => (
        <button
          key={o.code}
          type="button"
          onClick={() => pick(o.code)}
          title={o.title}
          aria-pressed={o.code === current}
          data-testid={`lang-${o.code}`}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-semibold transition',
            o.code === current ? 'bg-brand-600 text-white shadow' : 'text-slate-500 hover:bg-slate-100',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

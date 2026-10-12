import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Languages, ListChecks, RotateCcw, ShieldCheck } from 'lucide-react';
import { getSessionUser } from '@/lib/auth';
import { getPlanPrices } from '@/lib/repo/config';
import { PLANS, perDayAmount } from '@/lib/plans';
import { formatPrice } from '@/lib/utils';
import { getSiteLang } from '@/lib/site-lang';
import { LANDING } from '@/lib/site-i18n';
import LangSwitcher from '@/components/LangSwitcher';
import { sellerLine } from '@/lib/seller';
import { getDisplayCurrency } from '@/lib/site-currency';

export const dynamic = 'force-dynamic';

const ICONS = [ListChecks, RotateCcw, Languages, ShieldCheck];

export default async function Landing() {
  if (await getSessionUser()) redirect('/dashboard');
  const lang = getSiteLang();
  const t = LANDING[lang];
  const prices = await getPlanPrices();
  const cur = getDisplayCurrency(lang);
  return (
    <div className="min-h-dvh" lang={lang}>
      <header className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-5">
        <div className="text-lg font-bold">{t.brand}</div>
        <div className="flex items-center gap-2">
          <LangSwitcher current={lang} />
          <Link href="/login" className="btn btn-ghost btn-sm">{t.login}</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-16">
        <section className="py-12 text-center sm:py-20">
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
            {t.heroTop}<br /><span className="text-brand-600">{t.heroAccent}</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-slate-500">{t.heroSub}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/login" className="btn btn-primary text-lg">{t.ctaStart}</Link>
            <a href="#pricing" className="btn btn-ghost text-lg">{t.ctaPricing}</a>
          </div>
          <p className="mt-3 text-xs text-slate-500">{t.freeNote}</p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {t.features.map(({ title, text }, i) => {
            const Icon = ICONS[i];
            return (
              <div key={title} className="card p-5">
                <Icon className="mb-3 text-brand-600" size={24} />
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{text}</p>
              </div>
            );
          })}
        </section>

        <section id="pricing" className="card mx-auto mt-14 max-w-sm p-8 text-center">
          <div className="text-sm font-medium text-brand-600">{t.priceBadge}</div>
          <div className="mt-1 text-sm text-slate-500">{t.priceDays}</div>
          <div className="mt-5 space-y-2.5" data-testid="landing-plans">
            {PLANS.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3.5 text-left">
                <div>
                  <div className="font-semibold">{t.planTitles[i]}</div>
                  <div className="text-xs text-slate-500">≈ {perDayAmount(prices[p.id], p.days, cur)} {t.perDay}{p.guarantee ? ` · ${t.withGuarantee}` : ''}</div>
                </div>
                <div className="text-xl font-bold" data-testid={`landing-price-${p.id}`}>{formatPrice(prices[p.id], cur)}</div>
              </div>
            ))}
          </div>
          <ul className="mt-6 space-y-2 text-left text-sm text-slate-600">
            {t.priceList.map((x) => (
              <li key={x}>✓ {x}</li>
            ))}
          </ul>
          <Link href="/login" className="btn btn-primary mt-7 w-full">{t.priceCta}</Link>
        </section>
      </main>

      <footer className="mx-auto max-w-3xl px-5 pb-10 text-center text-xs leading-relaxed text-slate-400">
        {t.disclaimer}<br />
        <Link href="/legal" className="underline">{t.legal}</Link>
        <span className="mx-1.5">·</span>
        <Link href="/legal/offer" className="underline">{t.offer}</Link>
        <span className="mx-1.5">·</span>
        <Link href="/legal/privacy" className="underline">{t.privacy}</Link>
        <p className="mt-24 text-[9px] leading-snug text-slate-300/80" data-testid="seller-info">{sellerLine()}</p>
      </footer>
    </div>
  );
}

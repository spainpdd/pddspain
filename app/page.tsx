import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Languages, ListChecks, RotateCcw, ShieldCheck } from 'lucide-react';
import { getSessionUser } from '@/lib/auth';
import { getPricing } from '@/lib/repo/config';
import { formatPrice } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const features = [
  { icon: ListChecks, title: '90 тестов по 30 вопросов', text: 'Идёте по порядку: не больше 2 ошибок — открывается следующий тест. После каждого ответа сразу пояснение по правилам.' },
  { icon: RotateCcw, title: 'Раздел ошибок', text: 'Каждый неверный ответ запоминается. Заходите в «Ошибки» — и получаете по 5 вопросов, которые пока не даются.' },
  { icon: Languages, title: 'Перевод в один тап', text: 'Учите билеты на испанском или английском и в любой момент включайте перевод на русский или армянский.' },
  { icon: ShieldCheck, title: 'Гарантия «до сдачи»', text: 'Не сдали с первого раза — доступ продлевается, пока не сдадите экзамен.' },
];

export default async function Landing() {
  if (await getSessionUser()) redirect('/dashboard');
  const pricing = await getPricing();
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
        <div className="text-lg font-bold">🚦 DGT Права</div>
        <Link href="/login" className="btn btn-ghost btn-sm">Войти</Link>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-16">
        <section className="py-12 text-center sm:py-20">
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
            Сдайте теорию DGT<br /><span className="text-brand-600">с первого раза</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-slate-500">
            Тренажёр для русско- и армяноязычных: решаете реальный формат теста, а непонятное переводится одним тапом.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/login" className="btn btn-primary text-lg">Начать бесплатно</Link>
            <a href="#pricing" className="btn btn-ghost text-lg">Тариф</a>
          </div>
          <p className="mt-3 text-xs text-slate-500">Один тест в день — бесплатно, без карты.</p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-5">
              <Icon className="mb-3 text-brand-600" size={24} />
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{text}</p>
            </div>
          ))}
        </section>

        <section id="pricing" className="card mx-auto mt-14 max-w-sm p-8 text-center">
          <div className="text-sm font-medium text-brand-600">Один тариф</div>
          <div className="mt-2 text-5xl font-bold">{formatPrice(pricing)}</div>
          <div className="mt-1 text-slate-500">100 дней доступа</div>
          <ul className="mt-6 space-y-2 text-left text-sm text-slate-600">
            <li>✓ Все тесты и раздел ошибок</li>
            <li>✓ Испанский / английский + русский / армянский</li>
            <li>✓ Бот в Telegram: вопрос дня и ваши результаты</li>
            <li>✓ Не сдали с первого раза — доступ продлевается</li>
            <li>✓ Работает как приложение на телефоне</li>
          </ul>
          <Link href="/login" className="btn btn-primary mt-7 w-full">Получить доступ</Link>
        </section>
      </main>

      <footer className="mx-auto max-w-3xl px-5 pb-10 text-center text-xs leading-relaxed text-slate-400">
        Независимый учебный сервис. Не связан с Dirección General de Tráfico (DGT) и не является официальным ресурсом.<br />
        <Link href="/legal" className="underline">Условия и конфиденциальность</Link>
      </footer>
    </div>
  );
}

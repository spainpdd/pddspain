'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/** Ждёт, пока оплата отразится в профиле (вебхук мог прийти чуть позже) */
export default function PayStatus({ initiallyPaid }: { initiallyPaid: boolean }) {
  const [paid, setPaid] = useState(initiallyPaid);
  useEffect(() => {
    if (paid) return;
    let n = 0;
    const t = setInterval(async () => {
      n++;
      const r = await fetch('/api/me').then((x) => x.json()).catch(() => null);
      if (r?.access?.paid) {
        setPaid(true);
        clearInterval(t);
      }
      if (n > 20) clearInterval(t);
    }, 2000);
    return () => clearInterval(t);
  }, [paid]);

  return paid ? (
    <>
      <div className="text-5xl">🎉</div>
      <h1 className="mt-4 text-2xl font-bold">Оплата прошла</h1>
      <p className="mt-2 text-slate-400">Все тесты открыты. Удачи!</p>
      <Link href="/dashboard" className="btn btn-primary mt-6">Начать</Link>
    </>
  ) : (
    <>
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-brand-500" />
      <h1 className="mt-4 text-xl font-bold">Подтверждаем оплату…</h1>
      <p className="mt-2 text-sm text-slate-400">Обычно это занимает несколько секунд. Если доступ не появился в течение минуты — напишите нам.</p>
    </>
  );
}

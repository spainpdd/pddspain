import Link from 'next/link';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** urlReturn Prodamus: покупатель вернулся без оплаты (отмена или ошибка) */
export default async function PayFail() {
  await requireUser();
  return (
    <div className="pt-16 text-center">
      <div className="text-5xl">😕</div>
      <h1 className="mt-4 text-2xl font-bold">Оплата не прошла</h1>
      <p className="mt-2 text-slate-500">Деньги не списаны. Можно попробовать ещё раз или другой картой.</p>
      <Link href="/pay" className="btn btn-primary mt-6">Вернуться к оплате</Link>
    </div>
  );
}

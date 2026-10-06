import { accessInfo, requireUser } from '@/lib/auth';
import PayStatus from '@/components/PayStatus';

export const dynamic = 'force-dynamic';

/**
 * urlSuccess Prodamus: сюда возвращают покупателя после оплаты. Доступ открывает вебхук
 * (серверное уведомление), поэтому здесь ничего из адресной строки не принимаем на веру —
 * только показываем реальное состояние доступа и ждём, пока оно появится.
 */
export default async function PaySuccess() {
  const user = await requireUser();
  const acc = await accessInfo(user);
  return (
    <div className="pt-16 text-center">
      <PayStatus initiallyPaid={acc.paid} />
    </div>
  );
}

import { Check } from 'lucide-react';
import { accessInfo, requireUser } from '@/lib/auth';
import { stripeConfigured } from '@/lib/billing';
import PayForm from '@/components/PayForm';
import { formatDate } from '@/lib/utils';

export const metadata = { title: 'Доступ' };

export default async function PayPage() {
  const user = await requireUser();
  const acc = accessInfo(user);
  return (
    <div>
      <h1 className="text-2xl font-bold">Полный доступ</h1>
      <p className="mt-1 text-sm text-slate-400">Один платёж, без автопродления.</p>

      <div className="card mt-6 p-6 text-center">
        <div className="text-5xl font-bold">50 €</div>
        <div className="mt-1 text-slate-400">100 дней доступа</div>
        <ul className="mt-6 space-y-2.5 text-left text-sm text-slate-300">
          {[
            'Все тесты и раздел ошибок по 5 вопросов',
            'ES / EN с переводом на русский и армянский в один тап',
            'Пояснение по правилам после каждого ответа',
            'Гарантия: не сдали с первого раза — доступ продлевается, пока не сдадите',
          ].map((t) => (
            <li key={t} className="flex gap-2.5"><Check size={18} className="mt-0.5 shrink-0 text-green-400" />{t}</li>
          ))}
        </ul>
        {acc.paid && <p className="mt-5 text-xs text-slate-500">Сейчас доступ до {formatDate(user.access_until)}; новые 100 дней добавятся к этому сроку.</p>}
        <div className="mt-6"><PayForm configured={stripeConfigured()} /></div>
      </div>
    </div>
  );
}

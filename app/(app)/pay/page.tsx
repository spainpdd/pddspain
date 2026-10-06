import { Check } from 'lucide-react';
import { accessInfo, requireUser } from '@/lib/auth';
import { prodamusConfigured } from '@/lib/prodamus-pay';
import { env } from '@/lib/env';
import { chargeNote } from '@/lib/currency';
import { getDisplayCurrency } from '@/lib/site-currency';
import { getPricing } from '@/lib/repo/config';
import PayForm from '@/components/PayForm';
import { formatDate, formatPrice } from '@/lib/utils';

export const metadata = { title: 'Доступ' };

export default async function PayPage() {
  const user = await requireUser();
  const [acc, pricing] = await Promise.all([accessInfo(user), getPricing()]);
  const cur = getDisplayCurrency(user.trans_lang);
  const price = formatPrice(pricing, cur);
  const note = chargeNote(pricing, cur);
  return (
    <div>
      <h1 className="text-2xl font-bold">Полный доступ</h1>
      <p className="mt-1 text-sm text-slate-400">Один платёж, без автопродления.</p>

      <div className="card mt-6 p-6 text-center">
        <div className="text-5xl font-bold">{price}</div>
        <div className="mt-1 text-slate-400">100 дней доступа</div>
        {note && <p className="mx-auto mt-3 max-w-xs text-[11px] leading-relaxed text-slate-500" data-testid="charge-note">{note}</p>}
        <ul className="mt-6 space-y-2.5 text-left text-sm text-slate-700">
          {[
            'Все тесты и раздел ошибок по 5 вопросов',
            'ES / EN с переводом на русский и армянский в один тап',
            'Пояснение по правилам после каждого ответа',
            'Гарантия: не сдали с первого раза — доступ продлевается, пока не сдадите',
          ].map((t) => (
            <li key={t} className="flex gap-2.5"><Check size={18} className="mt-0.5 shrink-0 text-green-600" />{t}</li>
          ))}
        </ul>
        {acc.paid && <p className="mt-5 text-xs text-slate-500">Сейчас доступ до {formatDate(user.access_until)}; новые 100 дней добавятся к этому сроку.</p>}
        <div className="mt-6"><PayForm configured={prodamusConfigured()} priceLabel={price} testMode={env.prodamusTest} /></div>
      </div>
    </div>
  );
}

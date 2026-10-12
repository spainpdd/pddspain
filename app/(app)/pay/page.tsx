import { Check } from 'lucide-react';
import { accessInfo, requireUser } from '@/lib/auth';
import { prodamusConfigured } from '@/lib/prodamus-pay';
import { env } from '@/lib/env';
import { chargeNote } from '@/lib/currency';
import { getDisplayCurrency } from '@/lib/site-currency';
import { getPlanPrices } from '@/lib/repo/config';
import { DEFAULT_PLAN, PLANS, perDayAmount } from '@/lib/plans';
import PayForm, { type PlanView } from '@/components/PayForm';
import { formatDate, formatPrice } from '@/lib/utils';

export const metadata = { title: 'Доступ' };

export default async function PayPage() {
  const user = await requireUser();
  const [acc, prices] = await Promise.all([accessInfo(user), getPlanPrices()]);
  const cur = getDisplayCurrency(user.trans_lang);
  const plans: PlanView[] = PLANS.map((p) => ({
    id: p.id,
    title: p.title,
    days: p.days,
    price: formatPrice(prices[p.id], cur),
    perDay: perDayAmount(prices[p.id], p.days, cur),
    guarantee: p.guarantee,
    note: chargeNote(prices[p.id], cur),
  }));
  return (
    <div>
      <h1 className="text-2xl font-bold">Полный доступ</h1>
      <p className="mt-1 text-sm text-slate-400">Выберите срок. Один платёж, без автопродления.</p>

      <div className="card mt-6 p-5">
        <PayForm plans={plans} defaultPlan={DEFAULT_PLAN} configured={prodamusConfigured()} testMode={env.prodamusTest} />
        <ul className="mt-6 space-y-2.5 border-t border-slate-200/60 pt-5 text-left text-sm text-slate-700">
          {[
            'Все тесты и раздел ошибок по 5 вопросов',
            'ES / EN с переводом на русский и армянский в один тап',
            'Пояснение по правилам после каждого ответа',
            'Гарантия на тарифе «100 дней»: не сдали с первого раза — доступ продлевается на 30 дней',
          ].map((t) => (
            <li key={t} className="flex gap-2.5"><Check size={18} className="mt-0.5 shrink-0 text-green-600" />{t}</li>
          ))}
        </ul>
        {acc.paid && <p className="mt-5 text-xs text-slate-500">Сейчас доступ до {formatDate(user.access_until)}; купленные дни добавятся к этому сроку.</p>}
      </div>
    </div>
  );
}

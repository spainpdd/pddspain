import { getPricing } from '@/lib/repo/config';
import { PricingForm } from '@/components/admin/PricingForm';

export default async function PricingPage() {
  const pricing = await getPricing();
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Цены</h1>
      <p className="mb-5 max-w-md text-sm text-slate-400">
        Оплата всегда идёт картой в евро через Stripe — это единственная сумма, которую реально списывают. Рубли и драмы — ориентир,
        который видят пользователи с русским/армянским переводом рядом с ценой в евро (курс меняется, поэтому обновляйте вручную).
      </p>
      <PricingForm pricing={pricing} />
    </div>
  );
}

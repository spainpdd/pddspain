import { getPricing } from '@/lib/repo/config';
import { PricingForm } from '@/components/admin/PricingForm';

export default async function PricingPage() {
  const pricing = await getPricing();
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Цены</h1>
      <p className="mb-5 max-w-md text-sm text-slate-400">
        Реально списывается только цена в рублях (через Prodamus). Пользователям в Европе показывается цена в евро, в Армении — в драмах,
        в России — в рублях; в евро и драмах это пересчёт, итоговая сумма в валюте карты зависит от курса банка. Курс меняется — обновляйте вручную.
      </p>
      <PricingForm pricing={pricing} />
    </div>
  );
}

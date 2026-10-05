import Link from 'next/link';
import { LegalShell } from '@/components/LegalShell';
import { LEGAL_DATE } from '@/lib/seller';

export const metadata = { title: 'Условия и источники' };

/** Сводная страница: ссылки на документы + источники материалов. Не юридическая консультация. */
export default function Legal() {
  return (
    <LegalShell title="Условия и источники материалов" date={LEGAL_DATE}>
      <ul className="list-disc space-y-1 pl-5">
        <li><Link href="/legal/offer" className="underline">Публичная оферта</Link> — условия доступа, оплаты, возврата и гарантии «до сдачи».</li>
        <li><Link href="/legal/privacy" className="underline">Политика конфиденциальности</Link> — какие данные мы обрабатываем и cookie.</li>
        <li><Link href="/legal/consent" className="underline">Согласие на обработку персональных данных</Link>.</li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold text-slate-900" id="sources">1. Источники материалов</h2>
      <p>Вопросы с пометкой «Fuente: DGT» воспроизведены из публичного симулятора экзамена Dirección General de Tráfico (Organismo Autónomo Jefatura Central de Tráfico, sede.dgt.gob.es) без изменения содержания. Эту информацию можно получить бесплатно на сайте DGT; в сервисе вы платите за тренажёр, порядок прохождения, работу над ошибками, переводы, напоминания и поддержку. Переводы на русский и армянский — неофициальные, выполнены нами и могут содержать неточности; в случае расхождений верен испанский текст. Остальные вопросы, пояснения и переводы подготовлены нами. Сервис не является официальным и не одобрен DGT.</p>
      <p className="mt-2">Тексты законов (RGC, LSV) находятся в свободном доступе; пояснения ссылаются на действующие нормы, но не заменяют их — проверяйте актуальную редакцию на boe.es.</p>
    </LegalShell>
  );
}

import { redirect } from 'next/navigation';

/** Старая ссылка вида /test/5 (до разделения на официальные/дополнительные тесты) — уводим в раздел official.
 *  Именно поэтому у параметра то же имя (category), что и в /test/[category]/[n]: Next.js требует одинаковое
 *  имя динамического сегмента на одном уровне пути. */
export default function LegacyTestRedirect({ params }: { params: { category: string } }) {
  redirect(`/test/official/${params.category}`);
}

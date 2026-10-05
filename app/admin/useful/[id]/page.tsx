import { notFound } from 'next/navigation';
import { getUsefulPage, listUsefulAdmin } from '@/lib/repo/useful';
import UsefulEditor from '@/components/admin/UsefulEditor';

export const dynamic = 'force-dynamic';

export default async function EditUsefulPage({ params }: { params: { id: string } }) {
  const [page, { sections }] = await Promise.all([getUsefulPage(params.id), listUsefulAdmin()]);
  if (!page) notFound();
  return <UsefulEditor key={page.id} page={page} sections={sections} />;
}

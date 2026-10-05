import { listUsefulAdmin } from '@/lib/repo/useful';
import UsefulEditor from '@/components/admin/UsefulEditor';

export const dynamic = 'force-dynamic';

export default async function NewUsefulPage() {
  const { sections } = await listUsefulAdmin();
  return <UsefulEditor page={null} sections={sections} />;
}

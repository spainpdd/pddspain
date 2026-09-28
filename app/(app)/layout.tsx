import { requireUser } from '@/lib/auth';
import { countOpenErrors } from '@/lib/repo/users';
import BottomNav from '@/components/BottomNav';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const errorsOpen = await countOpenErrors(user.id);
  return (
    <>
      <main className="mx-auto max-w-lg px-4 pb-24 pt-safe">{children}</main>
      <BottomNav errorsOpen={errorsOpen} />
    </>
  );
}

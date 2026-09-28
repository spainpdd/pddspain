import { accessInfo, requireUser } from '@/lib/auth';
import { fulfillSession, stripeClient, stripeConfigured } from '@/lib/billing';
import { getProfile } from '@/lib/repo/users';
import PayStatus from '@/components/PayStatus';

export const dynamic = 'force-dynamic';

export default async function PaySuccess({ searchParams }: { searchParams: { session_id?: string } }) {
  let user = await requireUser();
  // не ждём вебхук: проверяем сессию напрямую (идемпотентно), если она принадлежит этому пользователю
  const sid = searchParams.session_id;
  if (sid && /^cs_[A-Za-z0-9_]+$/.test(sid) && stripeConfigured()) {
    try {
      const s = await stripeClient().checkout.sessions.retrieve(sid);
      if (s.client_reference_id === user.id) {
        await fulfillSession(s);
        user = (await getProfile(user.id)) ?? user;
      }
    } catch (e) {
      console.error('pay/success: не удалось проверить сессию', e);
    }
  }
  return (
    <div className="pt-16 text-center">
      <PayStatus initiallyPaid={accessInfo(user).paid} />
    </div>
  );
}

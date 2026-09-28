import { getDb } from '../db';
import { ACCESS_DAYS, decideClaim, type ClaimResult } from '../engine';

const EXTEND = `greatest(coalesce(access_until, now()), now()) + make_interval(days => $2::int)`;

/**
 * Записывает оплату и продлевает доступ. Идемпотентно по stripe_session_id:
 * повторный вебхук ничего не продлевает.
 */
export async function recordPayment(p: {
  userId: string;
  sessionId: string;
  amountCents: number;
  currency?: string;
  days?: number;
  consentAt?: Date | null;
}): Promise<{ granted: boolean }> {
  const days = p.days ?? ACCESS_DAYS;
  const db = await getDb();
  return db.tx(async (q) => {
    const ins = await q.query(
      `insert into payments (user_id, stripe_session_id, amount_cents, currency, days_granted, consent_at)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (stripe_session_id) do nothing returning id`,
      [p.userId, p.sessionId, p.amountCents, p.currency ?? 'eur', days, p.consentAt ?? null],
    );
    if (!ins.length) return { granted: false };
    await q.query(`update profiles set access_until = ${EXTEND}, guarantee_eligible = true where id = $1`, [p.userId, days]);
    return { granted: true };
  });
}

/** Ручная выдача/снятие дней (админка). Отрицательное число — уменьшить */
export async function grantDays(userId: string, days: number) {
  const db = await getDb();
  await db.query(`update profiles set access_until = ${EXTEND} where id = $1`, [userId, Math.trunc(days)]);
}

export async function createClaim(userId: string, examDate: string, result: ClaimResult) {
  const db = await getDb();
  return db.tx(async (q) => {
    const pr = (
      await q.query(`select guarantee_eligible, exam_passed_at from profiles where id = $1 for update`, [userId])
    )[0];
    if (!pr) return { ok: false as const, reason: 'no_user' as const };
    const first = (await q.query('select min(created_at) as t from payments where user_id = $1', [userId]))[0]?.t;

    const decision = decideClaim({
      eligible: !!pr.guarantee_eligible,
      alreadyPassed: !!pr.exam_passed_at,
      result,
      examDate,
      firstPaymentAt: first ? new Date(first) : null,
    });
    if (!decision.ok) return decision;

    // одна заявка на одну дату экзамена
    const dup = await q.query(
      `select 1 from exam_claims where user_id = $1 and exam_date = $2 and not revoked`,
      [userId, examDate],
    );
    if (dup.length) return { ok: false as const, reason: 'duplicate' as const };

    await q.query(
      `insert into exam_claims (user_id, exam_date, result, days_added) values ($1, $2, $3, $4)`,
      [userId, examDate, result, decision.addDays],
    );
    if (decision.markPassed) {
      await q.query('update profiles set exam_passed_at = now() where id = $1', [userId]);
    }
    if (decision.addDays > 0) {
      await q.query(`update profiles set access_until = ${EXTEND} where id = $1`, [userId, decision.addDays]);
    }
    return decision;
  });
}

export async function revokeClaim(claimId: string) {
  const db = await getDb();
  await db.tx(async (q) => {
    const c = (await q.query('select user_id, days_added, result, revoked from exam_claims where id = $1 for update', [claimId]))[0];
    if (!c || c.revoked) return;
    await q.query('update exam_claims set revoked = true where id = $1', [claimId]);
    if (c.days_added > 0) {
      await q.query(`update profiles set access_until = access_until - make_interval(days => $2::int) where id = $1`, [
        c.user_id,
        c.days_added,
      ]);
    }
    if (c.result === 'passed') {
      await q.query('update profiles set exam_passed_at = null where id = $1', [c.user_id]);
    }
  });
}

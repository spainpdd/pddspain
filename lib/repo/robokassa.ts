import { getDb } from '../db';

export interface Invoice {
  inv_id: string;
  user_id: string;
  out_sum_kopecks: number;
  status: 'pending' | 'paid';
  is_test: boolean;
  shown_currency: string | null;
  shown_amount: string | null;
  consent_at: string | null;
  created_at: string;
  paid_at: string | null;
}

const COLS = `inv_id::text as inv_id, user_id, round(out_sum * 100)::int as out_sum_kopecks, status, is_test,
  shown_currency, shown_amount::text as shown_amount, consent_at, created_at, paid_at`;

/** Создаёт счёт и возвращает его номер (InvId) */
export async function createInvoice(p: {
  userId: string;
  kopecks: number;
  isTest: boolean;
  shownCurrency?: string;
  shownAmount?: number;
  consentAt?: Date | null;
}): Promise<string> {
  const db = await getDb();
  const rows = await db.query<{ inv_id: string }>(
    `insert into robokassa_invoices (user_id, out_sum, is_test, shown_currency, shown_amount, consent_at)
     values ($1, $2::numeric / 100, $3, $4, $5, $6) returning inv_id::text as inv_id`,
    [p.userId, p.kopecks, p.isTest, p.shownCurrency ?? null, p.shownAmount ?? null, p.consentAt ?? null],
  );
  return rows[0].inv_id;
}

export async function getInvoice(invId: string): Promise<Invoice | null> {
  if (!/^\d{1,18}$/.test(invId)) return null;
  const db = await getDb();
  const rows = await db.query<Invoice>(`select ${COLS} from robokassa_invoices where inv_id = $1::bigint`, [invId]);
  return rows[0] ?? null;
}

/** pending → paid ровно один раз. true — этот вызов и перевёл счёт в paid (значит, доступ выдавать нужно) */
export async function markInvoicePaid(invId: string, p: { fee?: number | null; method?: string | null } = {}): Promise<boolean> {
  if (!/^\d{1,18}$/.test(invId)) return false;
  const db = await getDb();
  const rows = await db.query(
    `update robokassa_invoices set status = 'paid', paid_at = now(), fee = $2, payment_method = $3
     where inv_id = $1::bigint and status = 'pending' returning inv_id`,
    [invId, p.fee ?? null, p.method ?? null],
  );
  return rows.length === 1;
}

/** Сколько неоплаченных счетов пользователь создал за последний час (защита от спама) */
export async function countRecentPendingInvoices(userId: string): Promise<number> {
  const db = await getDb();
  const rows = await db.query<{ n: number }>(
    `select count(*)::int as n from robokassa_invoices
     where user_id = $1 and status = 'pending' and created_at > now() - interval '1 hour'`,
    [userId],
  );
  return rows[0]?.n ?? 0;
}

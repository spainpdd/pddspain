import { getDb } from '../db';

export interface Order {
  order_id: string;
  user_id: string;
  sum_kopecks: number;
  status: 'pending' | 'paid';
  is_test: boolean;
  shown_currency: string | null;
  shown_amount: string | null;
  consent_at: string | null;
  created_at: string;
  paid_at: string | null;
}

const COLS = `order_id::text as order_id, user_id, round(sum_rub * 100)::int as sum_kopecks, status, is_test,
  shown_currency, shown_amount::text as shown_amount, consent_at, created_at, paid_at`;

/** Создаёт заказ и возвращает его номер (order_id) */
export async function createOrder(p: {
  userId: string;
  kopecks: number;
  isTest: boolean;
  shownCurrency?: string;
  shownAmount?: number;
  consentAt?: Date | null;
}): Promise<string> {
  const db = await getDb();
  const rows = await db.query<{ order_id: string }>(
    `insert into prodamus_orders (user_id, sum_rub, is_test, shown_currency, shown_amount, consent_at)
     values ($1, $2::numeric / 100, $3, $4, $5, $6) returning order_id::text as order_id`,
    [p.userId, p.kopecks, p.isTest, p.shownCurrency ?? null, p.shownAmount ?? null, p.consentAt ?? null],
  );
  return rows[0].order_id;
}

export async function getOrder(orderId: string): Promise<Order | null> {
  if (!/^\d{1,18}$/.test(orderId)) return null;
  const db = await getDb();
  const rows = await db.query<Order>(`select ${COLS} from prodamus_orders where order_id = $1::bigint`, [orderId]);
  return rows[0] ?? null;
}

/** pending → paid ровно один раз. true — этот вызов и перевёл заказ в paid */
export async function markOrderPaid(orderId: string, p: { method?: string | null; prodamusId?: string | null } = {}): Promise<boolean> {
  if (!/^\d{1,18}$/.test(orderId)) return false;
  const db = await getDb();
  const rows = await db.query(
    `update prodamus_orders set status = 'paid', paid_at = now(), payment_method = $2, prodamus_id = $3
     where order_id = $1::bigint and status = 'pending' returning order_id`,
    [orderId, p.method ?? null, p.prodamusId ?? null],
  );
  return rows.length === 1;
}

/** Сколько неоплаченных заказов пользователь создал за последний час (защита от спама) */
export async function countRecentPendingOrders(userId: string): Promise<number> {
  const db = await getDb();
  const rows = await db.query<{ n: number }>(
    `select count(*)::int as n from prodamus_orders
     where user_id = $1 and status = 'pending' and created_at > now() - interval '1 hour'`,
    [userId],
  );
  return rows[0]?.n ?? 0;
}

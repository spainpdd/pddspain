import { getDb } from '../db';

/** Админка: обзор, платежи и выручка. Только чтение. */

const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : ((v as string | null) ?? null));

/** Единый список платежей: заказы Prodamus + платежи без заказа (Stripe, ручные, старые) */
const PAYMENTS_CTE = `
  x as (
    select 'prodamus'::text as src, i.order_id::text as ref, i.user_id, i.status, i.is_test,
           i.sum_rub::float8 as amount, 'RUB'::text as currency,
           i.shown_currency, i.shown_amount::float8 as shown_amount, null::float8 as fee, i.payment_method,
           i.created_at, i.paid_at, p.days_granted
      from prodamus_orders i left join payments p on p.stripe_session_id = 'pd:' || i.order_id::text
    union all
    select 'stripe', p.stripe_session_id, p.user_id, 'paid', false,
           (p.amount_cents / 100.0)::float8, upper(p.currency), null, null, null, null,
           p.created_at, p.created_at, p.days_granted
      from payments p where p.stripe_session_id not like 'pd:%'
  )`;

export const PAYMENT_FILTERS = ['all', 'live', 'test', 'pending'] as const;
export type PaymentFilter = (typeof PAYMENT_FILTERS)[number];

const PAY_FILTER_SQL: Record<PaymentFilter, string> = {
  all: 'true',
  live: `x.status = 'paid' and not x.is_test`,
  test: 'x.is_test',
  pending: `x.status = 'pending'`,
};

export interface PaymentRow {
  src: string;
  ref: string;
  user_id: string;
  user_name: string | null;
  telegram_username: string | null;
  status: string;
  is_test: boolean;
  amount: number;
  currency: string;
  shown_currency: string | null;
  shown_amount: number | null;
  fee: number | null;
  payment_method: string | null;
  created_at: string;
  paid_at: string | null;
  days_granted: number | null;
}

export async function listPayments(o: { filter?: string; page?: number; perPage?: number; user?: string } = {}) {
  const db = await getDb();
  const filter = (PAYMENT_FILTERS as readonly string[]).includes(o.filter ?? '') ? (o.filter as PaymentFilter) : 'all';
  const perPage = Math.min(Math.max(o.perPage ?? 50, 1), 500);
  const page = Math.max(o.page ?? 1, 1);
  const params: unknown[] = [];
  let w = PAY_FILTER_SQL[filter];
  if (o.user && /^[0-9a-f-]{36}$/i.test(o.user)) {
    params.push(o.user);
    w += ` and x.user_id = $${params.length}`;
  }
  const total = (await db.query<{ n: number }>(`with ${PAYMENTS_CTE} select count(*)::int as n from x where ${w}`, params))[0].n;
  const rows = await db.query(
    `with ${PAYMENTS_CTE}
     select x.*, u.display_name as user_name, u.telegram_username
       from x join profiles u on u.id = x.user_id
      where ${w}
      order by x.created_at desc
      limit ${perPage} offset ${(page - 1) * perPage}`,
    params,
  );
  return {
    rows: rows.map((r: any) => ({ ...r, created_at: iso(r.created_at) as string, paid_at: iso(r.paid_at) })) as PaymentRow[],
    total,
    page,
    perPage,
  };
}

export async function exportPayments(filter?: string) {
  const out: PaymentRow[] = [];
  for (let page = 1; page <= 40; page++) {
    const r = await listPayments({ filter, page, perPage: 500 });
    out.push(...r.rows);
    if (out.length >= r.total) break;
  }
  return out;
}

export interface PaymentsOverview {
  rub: { total: number; d30: number; d7: number; today: number };
  eur_total: number;
  paid_count: number;
  test_paid_count: number;
  pending_count: number;
  avg_check_rub: number;
  buyers: number;
  monthly: { m: string; sum: number; n: number }[];
  daily: { d: string; sum: number; n: number }[];
}

export async function paymentsOverview(): Promise<PaymentsOverview> {
  const db = await getDb();
  const live = `x.status = 'paid' and not x.is_test`;
  const r = (
    await db.query(
      `with ${PAYMENTS_CTE}
       select
         coalesce(sum(amount) filter (where ${live} and currency = 'RUB'), 0)::float8 as rub_total,
         coalesce(sum(amount) filter (where ${live} and currency = 'RUB' and paid_at >= now() - interval '30 days'), 0)::float8 as rub_30,
         coalesce(sum(amount) filter (where ${live} and currency = 'RUB' and paid_at >= now() - interval '7 days'), 0)::float8 as rub_7,
         coalesce(sum(amount) filter (where ${live} and currency = 'RUB' and paid_at::date = current_date), 0)::float8 as rub_today,
         coalesce(sum(amount) filter (where ${live} and currency = 'EUR'), 0)::float8 as eur_total,
         count(*) filter (where ${live})::int as paid_count,
         count(*) filter (where x.status = 'paid' and x.is_test)::int as test_paid,
         count(*) filter (where x.status = 'pending')::int as pending_count,
         count(distinct user_id) filter (where ${live})::int as buyers
       from x`,
    )
  )[0];
  const monthly = await db.query(
    `with ${PAYMENTS_CTE}, months as (select to_char(date_trunc('month', current_date) - (g || ' months')::interval, 'YYYY-MM') as m from generate_series(0, 11) g)
     select months.m, coalesce(sum(x.amount), 0)::float8 as sum, count(x.ref)::int as n
       from months left join x on to_char(x.paid_at, 'YYYY-MM') = months.m and ${live} and x.currency = 'RUB'
      group by months.m order by months.m`,
  );
  const daily = await db.query(
    `with ${PAYMENTS_CTE}
     select to_char(d::date, 'YYYY-MM-DD') as d, coalesce(sum(x.amount), 0)::float8 as sum, count(x.ref)::int as n
       from generate_series(current_date - 29, current_date, interval '1 day') d
       left join x on x.paid_at::date = d::date and ${live} and x.currency = 'RUB'
      group by d order by d`,
  );
  return {
    rub: { total: r.rub_total, d30: r.rub_30, d7: r.rub_7, today: r.rub_today },
    eur_total: r.eur_total,
    paid_count: r.paid_count,
    test_paid_count: r.test_paid,
    pending_count: r.pending_count,
    avg_check_rub: r.paid_count ? Math.round(r.rub_total / r.paid_count) : 0,
    buyers: r.buyers,
    monthly,
    daily,
  };
}

// ------------------------------------------------------------------ обзор

export interface AdminOverview {
  users: number;
  new7: number;
  new30: number;
  active_access: number;
  expiring7: number;
  blocked: number;
  admins: number;
  dau: number;
  wau: number;
  mau: number;
  answers_total: number;
  questions: number;
  unverified: number;
  no_ru: number;
  no_hy: number;
  tests: number;
  open_claims: number;
  new_reports: number;
  signups_daily: { d: string; n: number }[];
  answers_daily: { d: string; n: number }[];
  recent_users: { id: string; display_name: string | null; telegram_username: string | null; created_at: string; access_until: string | null }[];
  expiring: { id: string; display_name: string | null; telegram_username: string | null; access_until: string }[];
}

export async function adminOverview(): Promise<AdminOverview> {
  const db = await getDb();
  const r = (
    await db.query(
      `select
        (select count(*)::int from profiles) as users,
        (select count(*)::int from profiles where created_at >= now() - interval '7 days') as new7,
        (select count(*)::int from profiles where created_at >= now() - interval '30 days') as new30,
        (select count(*)::int from profiles where access_until > now()) as active_access,
        (select count(*)::int from profiles where access_until > now() and access_until <= now() + interval '7 days') as expiring7,
        (select count(*)::int from profiles where blocked_at is not null) as blocked,
        (select count(*)::int from profiles where is_admin) as admins,
        (select count(distinct user_id)::int from answer_log where created_at >= now() - interval '1 day') as dau,
        (select count(distinct user_id)::int from answer_log where created_at >= now() - interval '7 days') as wau,
        (select count(distinct user_id)::int from answer_log where created_at >= now() - interval '30 days') as mau,
        (select count(*)::int from answer_log) as answers_total,
        (select count(*)::int from questions) as questions,
        (select count(*)::int from questions where rights_status = 'unverified') as unverified,
        (select count(*)::int from questions qs where not exists (select 1 from question_translations t where t.question_id = qs.id and t.lang = 'ru')) as no_ru,
        (select count(*)::int from questions qs where not exists (select 1 from question_translations t where t.question_id = qs.id and t.lang = 'hy')) as no_hy,
        (select count(*)::int from tests) as tests,
        (select count(*)::int from exam_claims where not revoked and result = 'failed') as open_claims,
        (select count(*)::int from question_reports where status = 'new') as new_reports`,
    )
  )[0];
  const signups = await db.query(
    `select to_char(d::date, 'YYYY-MM-DD') as d, coalesce(s.n, 0)::int as n
       from generate_series(current_date - 29, current_date, interval '1 day') d
       left join (select created_at::date as day, count(*) as n from profiles group by 1) s on s.day = d::date order by d`,
  );
  const answers = await db.query(
    `select to_char(d::date, 'YYYY-MM-DD') as d, coalesce(s.n, 0)::int as n
       from generate_series(current_date - 29, current_date, interval '1 day') d
       left join (select created_at::date as day, count(*) as n from answer_log where created_at >= current_date - 29 group by 1) s on s.day = d::date order by d`,
  );
  const recent = await db.query(`select id, display_name, telegram_username, created_at, access_until from profiles order by created_at desc limit 8`);
  const expiring = await db.query(
    `select id, display_name, telegram_username, access_until from profiles
      where access_until > now() and access_until <= now() + interval '14 days' order by access_until limit 8`,
  );
  return {
    ...r,
    signups_daily: signups,
    answers_daily: answers,
    recent_users: recent.map((x: any) => ({ ...x, created_at: iso(x.created_at) as string, access_until: iso(x.access_until) })),
    expiring: expiring.map((x: any) => ({ ...x, access_until: iso(x.access_until) as string })),
  };
}

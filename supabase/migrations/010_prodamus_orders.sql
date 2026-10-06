-- ============================================================
-- Оплата через Prodamus: заказы (замена прежней платёжной системы).
--
-- order_id — числовой номер заказа, генерируем сами (identity); именно он уходит в Prodamus как order_id
-- и возвращается в уведомлении как order_num.
-- Списываем ВСЕГДА в рублях (sum_rub). shown_currency / shown_amount — в какой валюте и какую сумму
-- человек видел на нашей странице (EUR / AMD / RUB), хранится для разбора спорных случаев.
-- Доступ выдаёт вебхук: статус 'pending' → 'paid' (один раз), дальше запись в payments
-- (идемпотентность по payments.stripe_session_id = 'pd:<order_id>').
--
-- Предыдущая таблица счетов удаляется: боевых оплат через неё не было.
-- Применить: Supabase → SQL Editor → вставить весь файл → Run  (либо: npm run db:migrate)
-- ============================================================

create table if not exists public.prodamus_orders (
  order_id        bigint generated always as identity (start with 10001) primary key,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  sum_rub         numeric(12,2) not null check (sum_rub > 0),   -- рубли, ровно то, что уходит в Prodamus
  status          text not null default 'pending' check (status in ('pending', 'paid')),
  is_test         boolean not null default false,
  shown_currency  text,
  shown_amount    numeric(12,2),
  consent_at      timestamptz,
  payment_method  text,
  prodamus_id     text,                                          -- номер заказа на стороне Prodamus
  created_at      timestamptz not null default now(),
  paid_at         timestamptz
);

create index if not exists prodamus_orders_user_idx on public.prodamus_orders (user_id, created_at);

alter table public.prodamus_orders enable row level security;

drop table if exists public.robokassa_invoices;

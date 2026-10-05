-- ============================================================
-- Оплата через Robokassa: счета.
--
-- inv_id — числовой номер счёта (InvId): Robokassa принимает только целое от 1 до 9223372036854775807,
-- поэтому генерируем его сами (identity), а не берём из uuid.
-- Списываем ВСЕГДА в рублях (out_sum). shown_currency / shown_amount — в какой валюте и какую сумму
-- человек видел на нашей странице (EUR / AMD / RUB), хранится для разбора спорных случаев.
-- Доступ выдаёт ResultURL: статус 'pending' → 'paid' (один раз), дальше запись в payments
-- (идемпотентность по payments.stripe_session_id = 'rk:<inv_id>').
--
-- Применить: Supabase → SQL Editor → вставить весь файл → Run  (либо: npm run db:migrate)
-- ============================================================

create table if not exists public.robokassa_invoices (
  inv_id          bigint generated always as identity (start with 10001) primary key,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  out_sum         numeric(12,2) not null check (out_sum > 0),   -- рубли, ровно то, что уходит в OutSum
  status          text not null default 'pending' check (status in ('pending', 'paid')),
  is_test         boolean not null default false,
  shown_currency  text,
  shown_amount    numeric(12,2),
  consent_at      timestamptz,
  fee             numeric(12,2),
  payment_method  text,
  created_at      timestamptz not null default now(),
  paid_at         timestamptz
);

create index if not exists robokassa_invoices_user_idx on public.robokassa_invoices (user_id, created_at);

alter table public.robokassa_invoices enable row level security;

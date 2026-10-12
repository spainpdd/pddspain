-- ============================================================
-- Тарифы: заказ помнит, какой тариф куплен и на сколько дней.
-- 7 дней (week), 2 месяца = 60 дней (m2), 100 дней (d100, как раньше).
-- Применять ПОСЛЕ 010_prodamus_orders.sql.
-- Применить: Supabase → SQL Editor → вставить весь файл → Run  (либо: npm run db:migrate)
-- ============================================================

alter table public.prodamus_orders add column if not exists plan text not null default 'd100';
alter table public.prodamus_orders add column if not exists days int  not null default 100;
alter table public.prodamus_orders drop constraint if exists prodamus_orders_days_check;
alter table public.prodamus_orders add constraint prodamus_orders_days_check check (days > 0);

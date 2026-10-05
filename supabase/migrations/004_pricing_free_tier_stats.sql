-- ============================================================
-- 004: админ-редактируемые цены + «1 бесплатный тест в день» + статистика
-- ============================================================

-- ------------------------------------------------------------
-- Админ-редактируемые настройки (цены и т.п.), key/value
-- ------------------------------------------------------------
create table if not exists public.app_config (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

insert into public.app_config (key, value)
values ('pricing', jsonb_build_object('eur_cents', 4900, 'rub', 4900, 'amd', 23900))
on conflict (key) do nothing;

-- ------------------------------------------------------------
-- Бесплатный доступ: 1 тест в день (из первых FREE_TEST_POOL) для тех, у кого нет подписки.
-- Один выбранный тест можно пересдавать весь день; на следующий день — выбор снова свободный.
-- ------------------------------------------------------------
create table if not exists public.daily_free_test (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  free_date    date not null,
  test_number  int  not null,
  created_at   timestamptz not null default now(),
  primary key (user_id, free_date)
);

alter table public.app_config       enable row level security;
alter table public.daily_free_test  enable row level security;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on public.app_config, public.daily_free_test from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on public.app_config, public.daily_free_test from authenticated;
  end if;
end
$$;

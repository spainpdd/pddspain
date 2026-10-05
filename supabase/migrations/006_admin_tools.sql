-- ============================================================
-- 006: инструменты админки — блокировка, теги, заметки, журнал действий
-- Применить: Supabase → SQL Editor → вставить весь файл → Run (после 005)
-- ============================================================

alter table public.profiles add column if not exists blocked_at     timestamptz;
alter table public.profiles add column if not exists blocked_reason text;
alter table public.profiles add column if not exists tags           text[] not null default '{}';

-- Заметки администратора о пользователе
create table if not exists public.user_notes (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  author_id    uuid references public.profiles(id) on delete set null,
  author_name  text,
  body         text not null check (char_length(body) between 1 and 2000),
  created_at   timestamptz not null default now()
);
create index if not exists user_notes_user_idx on public.user_notes (user_id, created_at desc);

-- Журнал действий администраторов
create table if not exists public.admin_audit_log (
  id              bigint generated always as identity primary key,
  admin_id        uuid references public.profiles(id) on delete set null,
  admin_name      text,
  action          text not null,
  target_user_id  uuid references public.profiles(id) on delete set null,
  target_name     text,
  details         jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists admin_audit_created_idx on public.admin_audit_log (created_at desc);
create index if not exists admin_audit_target_idx  on public.admin_audit_log (target_user_id, created_at desc);

alter table public.user_notes       enable row level security;
alter table public.admin_audit_log  enable row level security;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on public.user_notes, public.admin_audit_log from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on public.user_notes, public.admin_audit_log from authenticated;
  end if;
end
$$;

-- 007: повторения в «Ошибках», проверки (закрепление) и раздел «Полезно».
-- Только добавляет: старый код продолжает работать на этой схеме.

-- ------------------------------------------------------------
-- 1. «Ошибки»: сколько повторений вопроса ещё нужно.
--    Каждая ошибка +1, верный ответ в разделе «Ошибки» −1.
-- ------------------------------------------------------------
alter table public.user_errors add column if not exists pending int not null default 0;
update public.user_errors set pending = 1 where not resolved and pending = 0;
alter table public.user_errors alter column pending set default 1;
create index if not exists user_errors_pending_idx on public.user_errors (user_id, pending);

-- ответы внутри проверок пишем с контекстом 'check'
alter table public.answer_log drop constraint if exists answer_log_context_check;
alter table public.answer_log
  add constraint answer_log_context_check check (context in ('test', 'review', 'errors', 'daily', 'check'));

-- ------------------------------------------------------------
-- 2. Проверки (закрепление) после каждых 10 тестов и финальная проверка.
--    Набор случайных тестов фиксируется при старте и не меняется до сдачи результата.
-- ------------------------------------------------------------
create table if not exists public.checkpoint_runs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  kind         text not null check (kind in ('mid', 'final')),
  milestone    int  not null,                       -- после какого по счёту теста курса (10, 20, …; для финальной — последний)
  tests        jsonb not null,                      -- [{category, number, display}]
  status       text not null default 'active' check (status in ('active', 'passed', 'failed')),
  results      jsonb,                               -- [{category, number, display, errors, total}]
  by_admin     boolean not null default false,      -- засчитана администратором вручную
  started_at   timestamptz not null default now(),
  finished_at  timestamptz
);
create unique index if not exists checkpoint_active_uq on public.checkpoint_runs (user_id, milestone) where status = 'active';
create index if not exists checkpoint_runs_user_idx on public.checkpoint_runs (user_id, milestone, status);

-- ------------------------------------------------------------
-- 3. «Полезно»: разделы и материалы (блоки контента), ru + hy
-- ------------------------------------------------------------
create table if not exists public.useful_sections (
  id          uuid primary key default gen_random_uuid(),
  title       jsonb not null default '{}'::jsonb,   -- {ru, hy}
  sort        int  not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.useful_pages (
  id            uuid primary key default gen_random_uuid(),
  section_id    uuid references public.useful_sections(id) on delete set null,
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  icon          text,                                -- эмодзи на карточке
  status        text not null default 'draft' check (status in ('draft', 'published')),
  sort          int  not null default 0,
  title         jsonb not null default '{}'::jsonb,  -- {ru, hy}
  summary       jsonb not null default '{}'::jsonb,  -- {ru, hy}
  blocks        jsonb not null default '{}'::jsonb,  -- {ru: [...], hy: [...]}
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  published_at  timestamptz
);
create index if not exists useful_pages_list_idx on public.useful_pages (status, section_id, sort);

alter table public.checkpoint_runs  enable row level security;
alter table public.useful_sections  enable row level security;
alter table public.useful_pages     enable row level security;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on public.checkpoint_runs, public.useful_sections, public.useful_pages from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on public.checkpoint_runs, public.useful_sections, public.useful_pages from authenticated;
  end if;
end
$$;

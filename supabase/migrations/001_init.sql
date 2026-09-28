-- ============================================================
-- DGT PWA — схема БД (Postgres / Supabase)
--
-- Применить: Supabase → SQL Editor → вставить весь файл → Run
-- либо: npm run db:migrate (нужен DATABASE_URL)
--
-- Приложение ходит в БД ТОЛЬКО с сервера (прямое подключение),
-- поэтому RLS включён на всех таблицах и политик нет: публичный
-- anon-ключ Supabase не даёт доступа ни к чему.
-- ============================================================

-- ------------------------------------------------------------
-- Пользователи (вход через Telegram)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id                  uuid primary key default gen_random_uuid(),
  telegram_id         bigint not null unique,      -- он же chat_id для бота
  telegram_username   text,
  display_name        text,
  photo_url           text,

  study_lang          text not null default 'es' check (study_lang in ('es','en')),
  trans_lang          text not null default 'ru' check (trans_lang in ('ru','hy')),
  auto_translate      boolean not null default false,
  notify              boolean not null default true,   -- рассылка бота (вопрос дня и т.п.)

  is_admin            boolean not null default false,

  access_until        timestamptz,                 -- платный доступ до этой даты
  guarantee_eligible  boolean not null default false, -- оплатил → действует гарантия «до сдачи»
  exam_passed_at      timestamptz,                 -- сдал экзамен → гарантия закрыта

  created_at          timestamptz not null default now(),
  last_seen_at        timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Банк вопросов
-- ------------------------------------------------------------
create table if not exists public.questions (
  id             uuid primary key default gen_random_uuid(),
  correct        char(1) not null check (correct in ('a','b','c')),
  image_url      text,
  topic          text,

  -- Происхождение прав. Пользователям по умолчанию отдаётся всё, кроме 'unverified'
  --   own          — вопрос написан вами
  --   dgt_official — официальный материал DGT (используется как есть, с указанием источника)
  --   licensed     — есть письменное разрешение правообладателя
  --   unverified   — источник/права не подтверждены (импорт из сторонних баз)
  rights_status  text not null default 'unverified'
                 check (rights_status in ('own','dgt_official','licensed','unverified')),
  source         text,          -- произвольная пометка: manual / dgt_sim / import ...
  source_ref     text,          -- id в исходной базе (для дедупликации при импорте)

  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists questions_active_idx on public.questions (is_active, rights_status);
create unique index if not exists questions_source_ref_idx
  on public.questions (source, source_ref) where source_ref is not null;

-- Тексты вопроса на каждом языке: es (оригинал), en, ru, hy
create table if not exists public.question_translations (
  question_id  uuid not null references public.questions(id) on delete cascade,
  lang         text not null check (lang in ('es','en','ru','hy')),
  text         text not null,
  option_a     text not null,
  option_b     text not null,
  option_c     text not null,
  explanation  text,
  status       text not null default 'machine' check (status in ('machine','reviewed')),
  updated_at   timestamptz not null default now(),
  primary key (question_id, lang)
);

-- ------------------------------------------------------------
-- 90 тестов по 30 вопросов
-- ------------------------------------------------------------
create table if not exists public.tests (
  number     int primary key check (number >= 1),
  title      text,
  is_active  boolean not null default true
);

create table if not exists public.test_questions (
  test_number  int not null references public.tests(number) on delete cascade,
  position     int not null check (position >= 1),
  question_id  uuid not null references public.questions(id) on delete restrict,
  primary key (test_number, position)
);

create index if not exists test_questions_question_idx on public.test_questions (question_id);

-- ------------------------------------------------------------
-- Прогресс пользователя
-- ------------------------------------------------------------
create table if not exists public.test_progress (
  user_id          uuid not null references public.profiles(id) on delete cascade,
  test_number      int  not null references public.tests(number) on delete cascade,
  attempts         int  not null default 0,
  best_errors      int,
  last_errors      int,
  passed           boolean not null default false,  -- ≤ 2 ошибок хотя бы раз
  passed_at        timestamptz,
  last_attempt_at  timestamptz,
  primary key (user_id, test_number)
);

-- Раздел «Ошибки»
create table if not exists public.user_errors (
  user_id        uuid not null references public.profiles(id) on delete cascade,
  question_id    uuid not null references public.questions(id) on delete cascade,
  times_wrong    int  not null default 1,
  last_wrong_at  timestamptz not null default now(),
  last_seen_at   timestamptz not null default now(),   -- когда последний раз показывали
  resolved       boolean not null default false,       -- верно решён в разделе «Ошибки»
  primary key (user_id, question_id)
);

create index if not exists user_errors_queue_idx
  on public.user_errors (user_id, resolved, last_seen_at);

-- Каждый ответ пользователя (для «Всего ответов» и статистики за день)
create table if not exists public.answer_log (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  question_id  uuid not null references public.questions(id) on delete cascade,
  chosen       char(1) not null check (chosen in ('a','b','c')),
  correct      boolean not null,
  context      text not null check (context in ('test','review','errors','daily')),
  created_at   timestamptz not null default now()
);

create index if not exists answer_log_user_idx on public.answer_log (user_id, created_at);

-- ------------------------------------------------------------
-- Оплаты и гарантия
-- ------------------------------------------------------------
create table if not exists public.payments (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles(id) on delete cascade,
  stripe_session_id  text not null unique,      -- идемпотентность вебхука
  amount_cents       int  not null,
  currency           text not null default 'eur',
  days_granted       int  not null,
  consent_at         timestamptz,               -- согласие: немедленное предоставление, отказ от desistimiento
  created_at         timestamptz not null default now()
);

create table if not exists public.exam_claims (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  exam_date   date not null,
  result      text not null check (result in ('failed','passed')),
  days_added  int  not null default 0,
  revoked     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists exam_claims_user_idx on public.exam_claims (user_id, created_at);

-- ------------------------------------------------------------
-- Безопасность: RLS включён, политик нет → доступ только серверу
-- ------------------------------------------------------------
alter table public.profiles              enable row level security;
alter table public.questions             enable row level security;
alter table public.question_translations enable row level security;
alter table public.tests                 enable row level security;
alter table public.test_questions        enable row level security;
alter table public.test_progress         enable row level security;
alter table public.user_errors           enable row level security;
alter table public.answer_log            enable row level security;
alter table public.payments              enable row level security;
alter table public.exam_claims           enable row level security;

-- В Supabase дополнительно забираем права у публичных ролей
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on all tables in schema public from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on all tables in schema public from authenticated;
  end if;
end
$$;

-- ============================================================
-- Рассылка материалов из «Полезно» в Telegram-бот (2 раза в неделю тем, кто не заходил 2+ дня).
-- Журнал нужен, чтобы не присылать один материал дважды и не писать чаще, чем раз в 3 дня.
-- Отключается так же, как «вопрос дня»: командой /stop в боте или переключателем в профиле (profiles.notify).
--
-- Применить: Supabase → SQL Editor → вставить весь файл → Run  (либо: npm run db:migrate)
-- ============================================================

create table if not exists public.useful_digest_log (
  id       bigint generated always as identity primary key,
  user_id  uuid not null references public.profiles(id)     on delete cascade,
  page_id  uuid not null references public.useful_pages(id) on delete cascade,
  sent_at  timestamptz not null default now(),
  unique (user_id, page_id)
);

create index if not exists useful_digest_log_user_idx on public.useful_digest_log (user_id, sent_at desc);

alter table public.useful_digest_log enable row level security;

-- ============================================================
-- Вход через Telegram-бота напрямую (deep-link t.me/<bot>?start=login_<token>).
-- Решает проблему iOS Safari, где официальный Login Widget (встроен в iframe)
-- часто не может открыть приложение Telegram и откатывается на веб-форму
-- с номером телефона.
--
-- Поток:
--   1) POST /api/auth/telegram/ticket создаёт запись 'pending' с токеном.
--   2) Клиент переходит на t.me/<bot>?start=login_<token> — это открывает
--      сам Telegram (гарантированно, обычная ссылка, а не iframe-редирект).
--   3) Пользователь жмёт Start; бот подтверждает тикет (lib/bot.ts).
--   4) Страница входа поллит GET /api/auth/telegram/ticket/<token> и,
--      как только status = 'confirmed', получает cookie сессии и переходит
--      на /dashboard.
--
-- Применить: Supabase → SQL Editor → вставить весь файл → Run
-- (после 001_init.sql и 002_test_categories.sql) либо: npm run db:migrate
-- ============================================================

create table if not exists public.login_tickets (
  token        text primary key,
  status       text not null default 'pending' check (status in ('pending', 'confirmed')),
  telegram_id  bigint,
  created_at   timestamptz not null default now(),
  confirmed_at timestamptz,
  expires_at   timestamptz not null default (now() + interval '10 minutes')
);

create index if not exists login_tickets_expires_idx on public.login_tickets (expires_at);

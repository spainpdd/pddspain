-- ============================================================
-- Два независимых раздела тестов: официальные (DGT, "own") и дополнительные
-- (сторонние источники вроде LordOkami — теперь видны всем без ограничений).
-- Каждый раздел нумеруется отдельно (в обоих может быть «Тест 1»), поэтому
-- первичный ключ тестов расширяется до (category, number).
--
-- Применить: Supabase → SQL Editor → вставить весь файл → Run (после 001_init.sql)
-- либо: npm run db:migrate
--
-- Порядок важен: сначала добавляем новые колонки, затем убираем старые внешние
-- ключи test_questions/test_progress → tests (они ссылаются на tests_pkey и
-- не дают его удалить), затем меняем первичные ключи, затем создаём новые
-- составные внешние ключи.
-- ============================================================

alter table public.tests
  add column if not exists category text not null default 'official'
    check (category in ('official', 'mixed'));

alter table public.test_questions
  add column if not exists test_category text not null default 'official'
    check (test_category in ('official', 'mixed'));

alter table public.test_progress
  add column if not exists test_category text not null default 'official'
    check (test_category in ('official', 'mixed'));

-- старые внешние ключи ссылаются на tests_pkey (number) — убираем их прежде,
-- чем менять первичный ключ tests, иначе drop constraint tests_pkey падает
-- с «other objects depend on it».
alter table public.test_questions drop constraint if exists test_questions_test_number_fkey;
alter table public.test_progress drop constraint if exists test_progress_test_number_fkey;

alter table public.test_questions drop constraint if exists test_questions_pkey;
alter table public.test_progress drop constraint if exists test_progress_pkey;
alter table public.tests drop constraint if exists tests_pkey;

alter table public.tests add constraint tests_pkey primary key (category, number);

alter table public.test_questions
  add constraint test_questions_pkey primary key (test_category, test_number, position);
alter table public.test_questions
  add constraint test_questions_test_fkey foreign key (test_category, test_number)
    references public.tests (category, number) on delete cascade;

alter table public.test_progress
  add constraint test_progress_pkey primary key (user_id, test_category, test_number);
alter table public.test_progress
  add constraint test_progress_test_fkey foreign key (test_category, test_number)
    references public.tests (category, number) on delete cascade;

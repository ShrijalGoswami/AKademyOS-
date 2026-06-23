-- Migration: Add score tables and import_logs to the `public` schema
-- These tables power the AKademy OS score tracking feature.
-- Scores reference public.profiles by email (not by uuid FK) so the
-- Google Sheets import path can match records without resolving auth UUIDs.

-- ─── 1. Homework scores ──────────────────────────────────────────────────────
create table if not exists public.homework_scores (
  id                  uuid primary key default gen_random_uuid(),
  user_email          text not null,
  week_number         smallint not null check (week_number between 1 and 10),
  mcq_score           numeric(5,2) not null default 0,
  short_answer_score  numeric(5,2) not null default 0,
  long_answer_score   numeric(5,2) not null default 0,
  mcq_max             numeric(5,2) not null default 100,
  short_answer_max    numeric(5,2) not null default 100,
  long_answer_max     numeric(5,2) not null default 100,
  published           boolean not null default false,
  updated_at          timestamptz not null default now(),
  constraint homework_scores_user_week unique (user_email, week_number)
);

-- ─── 2. Offline test scores ───────────────────────────────────────────────────
create table if not exists public.offline_test_scores (
  id          uuid primary key default gen_random_uuid(),
  user_email  text not null,
  week_number smallint not null check (week_number in (1, 5, 10)),
  score       numeric(5,2) not null default 0,
  max_score   numeric(5,2) not null default 100,
  published   boolean not null default false,
  updated_at  timestamptz not null default now(),
  constraint offline_test_scores_user_week unique (user_email, week_number)
);

-- ─── 3. Quiz scores ───────────────────────────────────────────────────────────
create table if not exists public.quiz_scores (
  id          uuid primary key default gen_random_uuid(),
  user_email  text not null,
  week_number smallint not null,
  quiz_title  text,
  score       numeric(5,2) not null default 0,
  max_score   numeric(5,2) not null default 100,
  published   boolean not null default false,
  updated_at  timestamptz not null default now()
);

-- ─── 4. Import logs ───────────────────────────────────────────────────────────
create table if not exists public.import_logs (
  id             uuid primary key default gen_random_uuid(),
  admin_email    text not null,
  score_type     text not null check (score_type in ('homework', 'offline_test', 'quiz')),
  spreadsheet_id text,
  rows_imported  int not null default 0,
  rows_failed    int not null default 0,
  status         text not null check (status in ('success', 'partial', 'failed')),
  error_details  jsonb,
  created_at     timestamptz not null default now()
);

-- ─── 5. Grant access to authenticated role ────────────────────────────────────
grant select, insert, update, delete
  on public.homework_scores, public.offline_test_scores,
     public.quiz_scores, public.import_logs
  to authenticated;

-- ─── 6. Enable RLS ────────────────────────────────────────────────────────────
alter table public.homework_scores      enable row level security;
alter table public.offline_test_scores  enable row level security;
alter table public.quiz_scores          enable row level security;
alter table public.import_logs          enable row level security;

-- ─── 7. RLS policies ─────────────────────────────────────────────────────────

-- Students see only their own published scores
create policy hw_select_own
  on public.homework_scores for select to authenticated
  using (
    user_email = (select email from public.profiles where id = auth.uid())
    and published = true
  );

create policy ot_select_own
  on public.offline_test_scores for select to authenticated
  using (
    user_email = (select email from public.profiles where id = auth.uid())
    and published = true
  );

create policy qz_select_own
  on public.quiz_scores for select to authenticated
  using (
    user_email = (select email from public.profiles where id = auth.uid())
    and published = true
  );

-- Admins have full access to score tables
create policy hw_admin_all
  on public.homework_scores for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy ot_admin_all
  on public.offline_test_scores for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy qz_admin_all
  on public.quiz_scores for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Only admins can insert/select import_logs
create policy logs_admin_all
  on public.import_logs for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

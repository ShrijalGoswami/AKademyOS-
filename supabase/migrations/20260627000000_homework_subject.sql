-- Migration: Add subject column to homework_scores
-- Drop the old unique constraint (user_email, week_number) and create a new one on (user_email, week_number, subject)

-- 1. Add column
alter table public.homework_scores
  add column if not exists subject text;

-- 2. Drop old constraint
alter table public.homework_scores
  drop constraint if exists homework_scores_user_week;

-- 3. Add new unique constraint
alter table public.homework_scores
  add constraint homework_scores_user_week_subject unique (user_email, week_number, subject);

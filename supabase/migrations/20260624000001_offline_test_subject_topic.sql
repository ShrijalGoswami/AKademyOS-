-- Migration: Add subject and topic columns to offline_test_scores
-- Drop the old unique constraint (user_email, week_number) and create a new one on (user_email, week_number, subject, topic)

-- 1. Add columns
alter table public.offline_test_scores
  add column if not exists subject text,
  add column if not exists topic text;

-- 2. Drop old constraint
alter table public.offline_test_scores
  drop constraint if exists offline_test_scores_user_week;

-- 3. Add new unique constraint
alter table public.offline_test_scores
  add constraint offline_test_scores_user_week_subject_topic unique (user_email, week_number, subject, topic);

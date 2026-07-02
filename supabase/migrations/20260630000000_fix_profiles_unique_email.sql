-- Migration: enforce unique emails in profiles and remove the Supabase Auth signup trigger
--
-- Context: the app uses NextAuth (not Supabase Auth). The on_auth_user_created
-- trigger was firing whenever a user's Google account touched Supabase Auth,
-- inserting a second profiles row for the same email. Because signIn() uses
-- .single(), having two rows caused silent login failures.
--
-- Fix:
--   1. Remove any duplicate email rows (keep the newest row per email).
--   2. Add a UNIQUE constraint on profiles.email so duplicates can never form again.
--   3. Drop the trigger + function — they are unused with NextAuth and were the
--      source of the duplicate rows.

-- 1. Deduplicate: delete every row that is NOT the most-recently-created row for its email.
DELETE FROM public.profiles
WHERE id NOT IN (
  SELECT DISTINCT ON (email) id
  FROM public.profiles
  WHERE email IS NOT NULL
  ORDER BY email, created_at DESC
);

-- 2. Unique constraint on email.
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- 3. Remove the Supabase Auth trigger and its backing function.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

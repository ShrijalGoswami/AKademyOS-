-- Migration: initialize the `public` schema for AKademyOS
--
-- The statements are written to be idempotent (safe to re-run).

-- 1. Role enum used by public.profiles.role
--    (CREATE TYPE has no "if not exists", so guard it.)
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'user_role'
      and n.nspname = 'public'
  ) then
    create type public.user_role as enum ('student', 'teacher', 'parent', 'admin');
  end if;
end
$$;

-- 2. Profiles: one row per user (defaults to auto-generated UUID).
create table if not exists public.profiles (
  id         uuid primary key default gen_random_uuid(),
  full_name  text,
  email      text,
  role       public.user_role not null default 'student',
  created_at timestamptz not null default now()
);



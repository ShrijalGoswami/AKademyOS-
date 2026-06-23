-- Migration: initialize the `akademy` schema for AKademyOS
--
-- IMPORTANT: This migration is scoped entirely to a NEW `akademy` schema.
-- It does NOT create, alter, or drop anything in the shared `public` schema,
-- which belongs to another website living in this same Supabase project.
--
-- The statements are written to be idempotent (safe to re-run).

-- 1. Dedicated schema so AKademyOS objects never collide with `public`.
create schema if not exists akademy;

-- 2. Role enum used by akademy.profiles.role
--    (CREATE TYPE has no "if not exists", so guard it.)
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'user_role'
      and n.nspname = 'akademy'
  ) then
    create type akademy.user_role as enum ('student', 'teacher', 'parent', 'admin');
  end if;
end
$$;

-- 3. Profiles: one row per Supabase auth user.
--    id is the primary key AND a FK to auth.users so a profile cannot
--    outlive its auth user.
create table if not exists akademy.profiles (
  id         uuid primary key
             references auth.users (id) on delete cascade,
  full_name  text,
  email      text,
  role       akademy.user_role not null default 'student',
  created_at timestamptz not null default now()
);

-- 4. Parent <-> child relationships between profiles.
--    Composite PK prevents duplicate links; both sides cascade-delete
--    when the referenced profile is removed.
create table if not exists akademy.parent_child (
  parent_id  uuid not null references akademy.profiles (id) on delete cascade,
  child_id   uuid not null references akademy.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (parent_id, child_id),
  constraint parent_child_no_self check (parent_id <> child_id)
);

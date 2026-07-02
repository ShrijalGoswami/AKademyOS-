-- Migration: Add calendar schema and student_calendar table
--
-- This powers the Student & Admin Calendar System.

-- 1. Create calendar schema
create schema if not exists calendar;


-- 2. Create student_calendar table
create table if not exists calendar.student_calendar (
  id               uuid primary key default gen_random_uuid(),
  full_name        text not null,
  email            text not null unique,
  calendar_data    jsonb not null default '[]'::jsonb,
  last_modified_at timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

-- 3. Create function and trigger for last_modified_at auto-updates
create or replace function calendar.update_last_modified()
returns trigger
language plpgsql
security definer
as $$
begin
  new.last_modified_at = now();
  return new;
end;
$$;

drop trigger if exists student_calendar_update_last_modified on calendar.student_calendar;
create trigger student_calendar_update_last_modified
  before update on calendar.student_calendar
  for each row
  execute function calendar.update_last_modified();

-- 4. Grant access to authenticated users
grant usage on schema calendar to authenticated;
grant select, insert, update, delete on calendar.student_calendar to authenticated;

-- 5. Enable Row-Level Security (RLS)
alter table calendar.student_calendar enable row level security;

-- 6. RLS Policies
-- Students can read their own calendar
create policy student_calendar_select_own
  on calendar.student_calendar for select to authenticated
  using (
    email = (select email from public.profiles where id = auth.uid())
  );

-- Students can insert their own calendar row
create policy student_calendar_insert_own
  on calendar.student_calendar for insert to authenticated
  with check (
    email = (select email from public.profiles where id = auth.uid())
  );

-- Students can update their own calendar row
create policy student_calendar_update_own
  on calendar.student_calendar for update to authenticated
  using (
    email = (select email from public.profiles where id = auth.uid())
  )
  with check (
    email = (select email from public.profiles where id = auth.uid())
  );

-- Admins can read all student calendars
create policy student_calendar_select_admin
  on calendar.student_calendar for select to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

-- 7. Expose the calendar schema to PostgREST
alter role authenticator set pgrst.db_schemas = 'public, calendar, graphql_public';
notify pgrst, 'reload config';

-- 8. RPC functions exposed in public schema for PostgREST bypassing

-- 8.1 Fetch calendar data for a given email
create or replace function public.get_student_calendar(p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public, calendar
as $$
declare
  v_data jsonb;
begin
  select calendar_data into v_data
  from calendar.student_calendar
  where email = p_email;
  
  return coalesce(v_data, '[]'::jsonb);
end;
$$;

-- 8.2 Insert/Update calendar data for a given email
create or replace function public.update_student_calendar(
  p_email text,
  p_full_name text,
  p_calendar_data jsonb
)
returns void
language plpgsql
security definer
set search_path = public, calendar
as $$
begin
  insert into calendar.student_calendar (email, full_name, calendar_data)
  values (p_email, p_full_name, p_calendar_data)
  on conflict (email)
  do update set
    calendar_data = p_calendar_data,
    full_name = p_full_name,
    last_modified_at = now();
end;
$$;

-- 8.3 Get all student activity logs
create or replace function public.get_student_calendar_activity()
returns table (
  full_name text,
  email text,
  last_modified_at timestamptz,
  calendar_data jsonb
)
language plpgsql
security definer
set search_path = public, calendar
as $$
begin
  return query
  select s.full_name, s.email, s.last_modified_at, s.calendar_data
  from calendar.student_calendar s
  where jsonb_array_length(s.calendar_data) > 0
  order by s.last_modified_at desc;
end;
$$;

-- 8.4 Delete student calendar rows older than cutoff timestamp
create or replace function public.delete_expired_student_calendars(p_cutoff_timestamp timestamptz)
returns int
language plpgsql
security definer
set search_path = public, calendar
as $$
declare
  v_deleted_count int;
begin
  with deleted as (
    delete from calendar.student_calendar
    where last_modified_at < p_cutoff_timestamp
    returning 1
  )
  select count(*) into v_deleted_count from deleted;
  
  return v_deleted_count;
end;
$$;

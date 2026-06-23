-- Migration: signup trigger that creates an akademy.profiles row per auth user
--
-- This is the ONLY sanctioned INSERT path into akademy.profiles. RLS denies
-- INSERT to anon/authenticated (no INSERT grant, no INSERT policy); this
-- SECURITY DEFINER function runs as its owner and so bypasses that restriction.
--
-- `role` is deliberately NOT set here, so it falls back to the column default
-- ('student'). A new user therefore can never self-assign an elevated role.

create or replace function akademy.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = akademy, public
as $$
begin
  insert into akademy.profiles (id, full_name, email)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function akademy.handle_new_user();

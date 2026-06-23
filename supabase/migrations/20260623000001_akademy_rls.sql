-- Migration: Row Level Security for the `public` schema
--
-- Applied BEFORE the schema is exposed over the API. Once RLS is enabled and
-- only the policies below exist, every access path that is not explicitly
-- allowed is DENIED (default-deny).
--
-- Roles in play (Supabase): `anon` (unauthenticated) and `authenticated`
-- (logged-in user). "Admin" is NOT a database role — it is a profile whose
-- `role` column = 'admin', detected via public.is_admin().
--
-- Scope: only `public.*`.

-- ---------------------------------------------------------------------------
-- 0. Privilege grants (RLS filters ROWS; GRANTs gate TABLE-level access).
--    anon gets schema usage only (no table privileges => fully denied).
--    authenticated gets DML, then RLS narrows it to the allowed rows.
--    NOTE: INSERT on profiles is intentionally NOT granted — profile rows are
--    created only by the SECURITY DEFINER signup trigger (next migration).
-- ---------------------------------------------------------------------------
grant select, update, delete on public.profiles      to authenticated;

-- ---------------------------------------------------------------------------
-- 1. Helper: is the current user an admin?
--    SECURITY DEFINER so it reads profiles WITHOUT triggering RLS — this both
--    avoids infinite recursion (a policy on profiles querying profiles) and
--    lets the check work before the caller can see their own row.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. Enable RLS (this is what makes everything default-deny).
-- ---------------------------------------------------------------------------
alter table public.profiles      enable row level security;

-- ===========================================================================
-- 3. Policies: public.profiles
--    (No INSERT policy on purpose — see grants above.)
-- ===========================================================================

-- SELECT: a user may read their own profile.
create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);



-- SELECT: admins may read every profile.
create policy profiles_select_admin
  on public.profiles
  for select
  to authenticated
  using (public.is_admin());

-- UPDATE: a user may update their own profile row.
-- (Role changes are blocked for non-admins by the trigger in section 4.)
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- UPDATE: admins may update any profile (including the role column).
create policy profiles_update_admin
  on public.profiles
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- DELETE: admins only. (Regular users get no DELETE policy => denied.)
create policy profiles_delete_admin
  on public.profiles
  for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 4. Block role escalation: a non-admin may never change profiles.role.
--    RLS WITH CHECK cannot see the OLD row, so this must be a trigger.
-- ---------------------------------------------------------------------------
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only admins may change a profile role'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_block_role_change on public.profiles;
create trigger profiles_block_role_change
  before update on public.profiles
  for each row
  execute function public.prevent_role_change();



-- Migration: Row Level Security for the `akademy` schema
--
-- Applied BEFORE the schema is exposed over the API. Once RLS is enabled and
-- only the policies below exist, every access path that is not explicitly
-- allowed is DENIED (default-deny).
--
-- Roles in play (Supabase): `anon` (unauthenticated) and `authenticated`
-- (logged-in user). "Admin" is NOT a database role — it is a profile whose
-- `role` column = 'admin', detected via akademy.is_admin().
--
-- Scope: only `akademy.*`. Nothing in `public` is touched.

-- ---------------------------------------------------------------------------
-- 0. Privilege grants (RLS filters ROWS; GRANTs gate TABLE-level access).
--    anon gets schema usage only (no table privileges => fully denied).
--    authenticated gets DML, then RLS narrows it to the allowed rows.
--    NOTE: INSERT on profiles is intentionally NOT granted — profile rows are
--    created only by the SECURITY DEFINER signup trigger (next migration).
-- ---------------------------------------------------------------------------
grant usage on schema akademy to anon, authenticated;
grant select, update, delete on akademy.profiles      to authenticated;
grant select, insert, update, delete on akademy.parent_child to authenticated;

-- ---------------------------------------------------------------------------
-- 1. Helper: is the current user an admin?
--    SECURITY DEFINER so it reads profiles WITHOUT triggering RLS — this both
--    avoids infinite recursion (a policy on profiles querying profiles) and
--    lets the check work before the caller can see their own row.
-- ---------------------------------------------------------------------------
create or replace function akademy.is_admin()
returns boolean
language sql
stable
security definer
set search_path = akademy, public
as $$
  select exists (
    select 1
    from akademy.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. Enable RLS (this is what makes everything default-deny).
-- ---------------------------------------------------------------------------
alter table akademy.profiles      enable row level security;
alter table akademy.parent_child  enable row level security;

-- ===========================================================================
-- 3. Policies: akademy.profiles
--    (No INSERT policy on purpose — see grants above.)
-- ===========================================================================

-- SELECT: a user may read their own profile.
create policy profiles_select_own
  on akademy.profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- SELECT: a parent may read a linked child's profile (via parent_child).
create policy profiles_select_child
  on akademy.profiles
  for select
  to authenticated
  using (
    exists (
      select 1
      from akademy.parent_child pc
      where pc.parent_id = auth.uid()
        and pc.child_id  = akademy.profiles.id
    )
  );

-- SELECT: admins may read every profile.
create policy profiles_select_admin
  on akademy.profiles
  for select
  to authenticated
  using (akademy.is_admin());

-- UPDATE: a user may update their own profile row.
-- (Role changes are blocked for non-admins by the trigger in section 4.)
create policy profiles_update_own
  on akademy.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- UPDATE: admins may update any profile (including the role column).
create policy profiles_update_admin
  on akademy.profiles
  for update
  to authenticated
  using (akademy.is_admin())
  with check (akademy.is_admin());

-- DELETE: admins only. (Regular users get no DELETE policy => denied.)
create policy profiles_delete_admin
  on akademy.profiles
  for delete
  to authenticated
  using (akademy.is_admin());

-- ---------------------------------------------------------------------------
-- 4. Block role escalation: a non-admin may never change profiles.role.
--    RLS WITH CHECK cannot see the OLD row, so this must be a trigger.
-- ---------------------------------------------------------------------------
create or replace function akademy.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = akademy, public
as $$
begin
  if new.role is distinct from old.role and not akademy.is_admin() then
    raise exception 'Only admins may change a profile role'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_block_role_change on akademy.profiles;
create trigger profiles_block_role_change
  before update on akademy.profiles
  for each row
  execute function akademy.prevent_role_change();

-- ===========================================================================
-- 5. Policies: akademy.parent_child
-- ===========================================================================

-- SELECT: a user may see link rows in which they are the parent or the child.
create policy parent_child_select_own
  on akademy.parent_child
  for select
  to authenticated
  using (parent_id = auth.uid() or child_id = auth.uid());

-- ALL: admins may read/write every link row.
-- (No write policy for non-admins => INSERT/UPDATE/DELETE denied for them.)
create policy parent_child_admin_all
  on akademy.parent_child
  for all
  to authenticated
  using (akademy.is_admin())
  with check (akademy.is_admin());

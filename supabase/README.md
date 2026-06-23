# supabase/

Version-controlled SQL migrations for the **AKademyOS** `akademy` schema.

> This is a **shared** Supabase project. The `public` schema belongs to another
> website. Every AKademyOS object lives in the `akademy` schema and migrations
> here must never touch `public`.

## Migrations

| File | Purpose |
|------|---------|
| `migrations/20260623000000_init_akademy_schema.sql` | Creates the `akademy` schema, `akademy.user_role` enum, `akademy.profiles`, and `akademy.parent_child`. |

## Applying a migration

Pick whichever matches your workflow. **Run against the shared project with care.**

**A. Dashboard SQL editor (no tooling):**
Open the project → SQL Editor → paste the migration file → Run.

**B. Supabase CLI (recommended, once installed & linked):**
```bash
supabase link --project-ref <your-project-ref>
supabase db push        # applies everything in supabase/migrations/
```

**C. psql:**
```bash
psql "<connection-string>" -f migrations/20260623000000_init_akademy_schema.sql
```

## ⚠️ Required dashboard step — expose the schema to the API

PostgREST will not serve the `akademy` schema until it is added to the API's
exposed-schema list:

**Dashboard → Project Settings → API → "Exposed schemas" → add `akademy` → Save.**

Until that is done, client/API calls against `akademy.*` will fail even though
the tables exist. Confirm this is set before relying on API access.

## TODO before production

- **Row Level Security (RLS).** These tables are created **without** RLS.
  Once `akademy` is exposed, RLS + policies should be added so the anon/auth
  API keys cannot read/write arbitrary rows. Tracked separately.

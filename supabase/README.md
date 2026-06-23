# supabase/

Version-controlled SQL migrations for the **AKademyOS** project.

## Migrations

| File | Purpose |
|------|---------|
| `migrations/20260623000000_init_akademy_schema.sql` | Creates the `user_role` enum and the `profiles` table in the `public` schema. |

## Applying a migration

Pick whichever matches your workflow.

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

## TODO before production

- **Row Level Security (RLS).** These tables are created **without** RLS by default. RLS + policies should be configured so only authorized requests can access them.

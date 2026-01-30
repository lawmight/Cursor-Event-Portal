# Table QR codes setup

If you see **"Could not find the table 'public.table_qr_codes' in the schema cache"**, the migration that creates this table hasn’t been run on your Supabase project.

## Fix

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **SQL Editor**.
3. Open `add_table_qr_codes_and_registrations.sql` in this folder, copy its contents, paste into the SQL Editor, and run it.

Or from the repo (with Supabase CLI and project linked):

```bash
cd portal
npx supabase db push
```

After the migration runs, Table QR Codes uploads should work.

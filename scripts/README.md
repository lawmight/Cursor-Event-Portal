# Scripts

## Startup / Update

`scripts/startup.sh` is a minimal bootstrap for local development and fresh clones. It:

1. Verifies Node.js is in the `>=20.0.0 <21.0.0` range required by `package.json` `engines`, and auto-switches to the pinned `.nvmrc` version (`20.18.1`) if `nvm` is available.
2. Runs `npm install`.
3. Seeds `.env.local` from `.env.local.example` if missing (set `NEXT_PUBLIC_USE_MOCK_DATA=true` there for mock mode).

### Usage

```bash
./scripts/startup.sh           # install + env bootstrap
./scripts/startup.sh --build   # also run `npm run build`
```

### Recommended runtime

Node 20 (pinned: `20.18.1` in `.nvmrc` / `.node-version`, matching `render.yaml` `NODE_VERSION`). Higher majors violate `engines.node` and may break native deps like `sharp`.

## Clear Slides

This script clears all slides from the database.

### Usage

1. Make sure you have the required environment variables set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Run the script:
   ```bash
   npm run clear-slides
   ```

   Or directly with tsx:
   ```bash
   npx tsx scripts/clear-slides.ts
   ```

### What it does

- Fetches all slides from the database
- Deletes all slides from the `slides` table
- Note: This does NOT delete the image files from Supabase Storage. You'll need to manually clean those up from the Storage dashboard if needed.

### Alternative: SQL Migration

You can also use the SQL migration file:
```sql
-- Run this in Supabase SQL Editor
DELETE FROM slides;
```

The migration file is located at: `supabase/migrations/clear_all_slides.sql`

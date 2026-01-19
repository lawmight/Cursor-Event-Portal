# Scripts

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

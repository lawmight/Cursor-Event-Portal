# Slide Deck Migration Guide

## Summary

The slides system has been migrated from individual slide management to a single slide deck (PDF) per event. This simplifies the upload process and aligns with the existing `slide_decks` table structure.

## Changes Made

### 1. Database Scripts

**Clear Slides Script**: `scripts/clear-slides.ts`
- TypeScript script to clear all slides from the database
- Run with: `npm run clear-slides` or `npx tsx scripts/clear-slides.ts`
- Requires: `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables

**SQL Migration**: `supabase/migrations/clear_all_slides.sql`
- Simple SQL script to delete all slides
- Can be run directly in Supabase SQL Editor

### 2. New Component

**SlideDeckAdminClient**: `src/app/admin/[eventSlug]/slides/SlideDeckAdminClient.tsx`
- New component that handles single PDF deck uploads
- Replaces the old `SlidesAdminClient` which handled individual slide uploads
- Features:
  - Upload entire PDF as one deck
  - Delete deck functionality
  - Preview of uploaded PDF
  - Better error handling

### 3. Updated Files

- **`src/app/admin/[eventSlug]/slides/page.tsx`**
  - Now uses `SlideDeckAdminClient` instead of `SlidesAdminClient`
  - Fetches slide deck data using `getSlideDeck()` instead of `getSlides()`

- **`src/app/admin/[eventSlug]/page.tsx`**
  - Updated navigation link text from "Slides" to "Slide Deck"
  - Updated description from "Presentation Control" to "PDF Upload"

### 4. Package Updates

- Added `tsx` as a dev dependency for running TypeScript scripts
- Added `clear-slides` npm script

## Migration Steps

### Step 1: Clear Existing Slides

**Option A: Using the TypeScript script**
```bash
cd portal
npm install  # Install tsx if not already installed
npm run clear-slides
```

**Option B: Using SQL**
1. Go to Supabase Dashboard → SQL Editor
2. Run the migration: `supabase/migrations/clear_all_slides.sql`
   ```sql
   DELETE FROM slides;
   ```

### Step 2: Deploy Changes

The new `SlideDeckAdminClient` component is already in place and will be used automatically. The old `SlidesAdminClient.tsx` file is kept for reference but is no longer used.

### Step 3: Test

1. Navigate to `/admin/[eventSlug]/slides`
2. You should see "Slide Deck Management" instead of "Slides Management"
3. Upload a PDF file - it should upload as a single deck
4. Verify the deck appears and can be deleted

## API Endpoints

The system uses the existing `/api/admin/upload-deck` endpoint which:
- Accepts PDF files only
- Stores them in the `slide-decks` storage bucket
- Creates/updates a record in the `slide_decks` table
- Returns the deck information

## Database Schema

The system uses the `slide_decks` table:
```sql
CREATE TABLE slide_decks (
  id UUID PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id),
  pdf_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  page_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE (event_id)
);
```

## Notes

- The old `slides` table is still in the database but no longer used by the admin interface
- Individual slide images may still exist in the `slides` storage bucket - these can be manually cleaned up if needed
- The display page (`/[eventSlug]/display`) already uses `slide_decks` via the `PdfDeckViewer` component, so no changes needed there

## Troubleshooting

**If the script fails:**
- Check that environment variables are set correctly
- Verify you have the service role key (not the anon key)
- Check Supabase connection

**If upload fails:**
- Verify the `slide-decks` storage bucket exists
- Check file size (max 100MB)
- Ensure file is a valid PDF

**If the page shows errors:**
- Check that the `slide_decks` table exists
- Verify RLS policies are set correctly
- Check browser console for errors

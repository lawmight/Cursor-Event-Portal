-- Run in Supabase SQL Editor. Ensures exactly one event for calgary-feb-2026 so the URL works.
-- Safe to run multiple times.

-- Remove duplicates, keep the one with latest id
DELETE FROM public.events a
USING public.events b
WHERE a.slug = 'calgary-feb-2026' AND b.slug = 'calgary-feb-2026' AND a.id < b.id;

-- Insert one row if none exist (works with or without UNIQUE on slug)
INSERT INTO public.events (
  slug, code, name, venue, address, venue_image_url,
  start_time, end_time, status, capacity
)
SELECT
  'calgary-feb-2026',
  'FEB2026',
  'Cursor Calgary February 2026',
  'House 831',
  '831 17 Ave SW, Calgary, AB T2T 0A1',
  '/house-831.webp',
  '2026-02-27T00:30:00Z',
  '2026-02-27T03:30:00Z',
  'published',
  65
WHERE NOT EXISTS (SELECT 1 FROM public.events WHERE slug = 'calgary-feb-2026');

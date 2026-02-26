-- Run this in Supabase SQL Editor to set House 831 venue/address/image/date and URL (slug) for an event.
-- Use Option A if your event still shows January or Platform / 407 9 Ave on the check-in page.

-- Option A: Update event that has OLD venue (Platform / 407 9 Ave) or January slug — full fix for check-in page + URL
UPDATE public.events
SET
  venue           = 'House 831',
  address         = '831 17 Ave SW, Calgary, AB T2T 0A1',
  venue_image_url = '/house-831.webp',
  start_time      = '2026-02-27T00:30:00Z',
  end_time        = '2026-02-27T03:30:00Z',
  slug            = 'calgary-feb-2026'
WHERE
  address ILIKE '%407 9 Ave%'
  OR venue ILIKE '%Platform%'
  OR slug ILIKE '%jan%';

-- Option B: Update by current slug only (change 'your-current-slug' to match)
-- UPDATE public.events
-- SET
--   venue = 'House 831',
--   address = '831 17 Ave SW, Calgary, AB T2T 0A1',
--   venue_image_url = '/house-831.webp',
--   start_time = '2026-02-27T00:30:00Z',
--   end_time = '2026-02-27T03:30:00Z',
--   slug = 'calgary-feb-2026'
-- WHERE slug = 'your-current-slug';

-- Verify after running Option A or B:
-- SELECT id, slug, name, venue, address, venue_image_url, start_time FROM public.events;

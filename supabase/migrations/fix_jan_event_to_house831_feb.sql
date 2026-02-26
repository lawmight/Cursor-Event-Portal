-- Fix the event that still shows January / Platform / 407 9 Ave on the check-in page.
-- Updates it to House 831, correct address, and February 2026 date/time; sets slug so URL shows Feb.
-- No-op if public.events does not exist (e.g. fresh DB or migrations-only setup).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'events'
  ) THEN
    ALTER TABLE public.events ADD COLUMN IF NOT EXISTS venue_image_url TEXT DEFAULT NULL;

    UPDATE public.events
    SET
      venue            = 'House 831',
      address          = '831 17 Ave SW, Calgary, AB T2T 0A1',
      venue_image_url  = '/house-831.webp',
      start_time       = '2026-02-27T00:30:00Z',   -- Feb 26, 5:30 PM MST
      end_time         = '2026-02-27T03:30:00Z',   -- Feb 26, 8:30 PM MST
      slug             = 'calgary-feb-2026'
    WHERE
      address ILIKE '%407 9 Ave%'
      OR venue ILIKE '%Platform%'
      OR slug ILIKE '%jan%'
      OR (name ILIKE '%January%' AND name ILIKE '%2026%');
  END IF;
END $$;

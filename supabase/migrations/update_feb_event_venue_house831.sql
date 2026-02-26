-- Update the February 2026 event to use House 831 venue details.
-- Ensures venue, address, and venue_image_url show on attendee pages and in EventHeader.
-- No-op if public.events does not exist (no error on DBs that use migrations-only and lack base schema).

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
      start_time       = COALESCE(start_time, '2026-02-27T00:30:00Z'),
      end_time         = COALESCE(end_time, '2026-02-27T03:30:00Z')
    WHERE
      slug = 'calgary-feb-2026'
      OR slug ILIKE '%feb-2026%'
      OR slug ILIKE '%feb%2026%'
      OR name ILIKE '%February%2026%'
      OR name ILIKE '%Feb%2026%';
  END IF;
END $$;

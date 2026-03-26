-- Fix agenda item times for the archived January 2026 event seed
-- Event: 5:00pm opening, 5:30pm start, 8:30pm finish local time on Jan 28, 2026
-- All times should be stored in UTC
-- 5:00pm MST = 12:00am UTC on Jan 29
-- 5:30pm MST = 12:30am UTC on Jan 29
-- 5:35pm MST = 12:35am UTC on Jan 29
-- 5:50pm MST = 12:50am UTC on Jan 29
-- 7:20pm MST = 2:20am UTC on Jan 29
-- 8:00pm MST = 3:00am UTC on Jan 29
-- 8:30pm MST = 3:30am UTC on Jan 29

-- Update "Short Demos" to correct time (5:35pm MST = 00:35 UTC)
UPDATE agenda_items
SET 
  start_time = '2026-01-29T00:35:00Z',
  end_time = '2026-01-29T00:50:00Z'
WHERE LOWER(title) = LOWER('Short Demos')
  AND event_id IN (SELECT id FROM events WHERE slug = 'legacy-jan-2026');

-- Verify all times are correct
-- Mingling & Networking: 5:00pm-5:30pm MST = 00:00-00:30 UTC
UPDATE agenda_items
SET 
  start_time = '2026-01-29T00:00:00Z',
  end_time = '2026-01-29T00:30:00Z'
WHERE LOWER(title) = LOWER('Mingling & Networking')
  AND event_id IN (SELECT id FROM events WHERE slug = 'legacy-jan-2026');

-- Welcome & Introductions: 5:30pm-5:35pm MST = 00:30-00:35 UTC
UPDATE agenda_items
SET 
  start_time = '2026-01-29T00:30:00Z',
  end_time = '2026-01-29T00:35:00Z'
WHERE LOWER(title) = LOWER('Welcome & Introductions')
  AND event_id IN (SELECT id FROM events WHERE slug = 'legacy-jan-2026');

-- Build Session: 5:50pm-7:20pm MST = 00:50-02:20 UTC
UPDATE agenda_items
SET 
  start_time = '2026-01-29T00:50:00Z',
  end_time = '2026-01-29T02:20:00Z'
WHERE LOWER(title) = LOWER('Build Session')
  AND event_id IN (SELECT id FROM events WHERE slug = 'legacy-jan-2026');

-- Blitz Demos & Community Voting: 7:20pm-8:00pm MST = 02:20-03:00 UTC
UPDATE agenda_items
SET 
  start_time = '2026-01-29T02:20:00Z',
  end_time = '2026-01-29T03:00:00Z'
WHERE LOWER(title) = LOWER('Blitz Demos & Community Voting')
  AND event_id IN (SELECT id FROM events WHERE slug = 'legacy-jan-2026');

-- Networking & Tear-Down: 8:00pm-8:30pm MST = 03:00-03:30 UTC
UPDATE agenda_items
SET 
  start_time = '2026-01-29T03:00:00Z',
  end_time = '2026-01-29T03:30:00Z'
WHERE LOWER(title) = LOWER('Networking & Tear-Down')
  AND event_id IN (SELECT id FROM events WHERE slug = 'legacy-jan-2026');

-- Fix "Short Demos" agenda item time
-- Historical helper for the original January event schedule.
-- Kept for reference even though current deployment uses Shanghai rebrand defaults.

UPDATE agenda_items
SET 
  start_time = '2026-01-29T00:35:00Z',  -- 5:35pm MST
  end_time = '2026-01-29T00:50:00Z'     -- 5:50pm MST
WHERE LOWER(title) = LOWER('Short Demos')
  AND event_id IN (SELECT id FROM events WHERE slug = 'shanghai-jan-2026');

-- Verify the update
SELECT 
  id,
  title,
  start_time,
  end_time,
  speaker
FROM agenda_items
WHERE LOWER(title) = LOWER('Short Demos')
  AND event_id IN (SELECT id FROM events WHERE slug = 'shanghai-jan-2026');

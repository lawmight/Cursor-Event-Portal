-- Update agenda items for Calgary Jan 2026 event with correct times and titles
-- Correct schedule (MST):
-- 5:30-6:00 PM - Arrivals and mingle
-- 6:00-6:10 PM - Intro to Cursor
-- 6:10-6:30 PM - Community demos
-- 6:30-7:30 PM - Building
-- 7:30-7:45 PM - Networking and judging
-- 7:45-8:00 PM - Build showcase
-- 8:00-8:30 PM - Wind-down
--
-- MST is UTC-7, so on Jan 28, 2026:
-- 5:30pm MST = 2026-01-29T00:30:00Z
-- 6:00pm MST = 2026-01-29T01:00:00Z
-- 6:10pm MST = 2026-01-29T01:10:00Z
-- 6:30pm MST = 2026-01-29T01:30:00Z
-- 7:30pm MST = 2026-01-29T02:30:00Z
-- 7:45pm MST = 2026-01-29T02:45:00Z
-- 8:00pm MST = 2026-01-29T03:00:00Z
-- 8:30pm MST = 2026-01-29T03:30:00Z

-- Update item 0: Mingling & Networking -> Arrivals and Mingle (5:30-6:00 PM MST)
UPDATE agenda_items
SET 
  title = 'Arrivals and Mingle',
  description = 'Connect with fellow developers. Collaboration pods available.',
  start_time = '2026-01-29T00:30:00Z',
  end_time = '2026-01-29T01:00:00Z',
  sort_order = 0,
  speaker = NULL
WHERE event_id IN (SELECT id FROM events WHERE slug = 'calgary-jan-2026')
  AND sort_order = 0;

-- Update item 1: Welcome & Introductions -> Intro to Cursor (6:00-6:10 PM MST)
UPDATE agenda_items
SET 
  title = 'Intro to Cursor',
  description = 'Event introduction and welcome.',
  start_time = '2026-01-29T01:00:00Z',
  end_time = '2026-01-29T01:10:00Z',
  sort_order = 1
WHERE event_id IN (SELECT id FROM events WHERE slug = 'calgary-jan-2026')
  AND sort_order = 1;

-- Update item 2: Short Demos -> Community Demos (6:10-6:30 PM MST)
UPDATE agenda_items
SET 
  title = 'Community Demos',
  description = 'Quick demos showcasing Cursor capabilities.',
  start_time = '2026-01-29T01:10:00Z',
  end_time = '2026-01-29T01:30:00Z',
  sort_order = 2
WHERE event_id IN (SELECT id FROM events WHERE slug = 'calgary-jan-2026')
  AND sort_order = 2;

-- Update item 3: Build Session -> Building (6:30-7:30 PM MST)
UPDATE agenda_items
SET 
  title = 'Building',
  description = 'Collaborative building session. Work with your pod and get help from facilitators.',
  start_time = '2026-01-29T01:30:00Z',
  end_time = '2026-01-29T02:30:00Z',
  sort_order = 3
WHERE event_id IN (SELECT id FROM events WHERE slug = 'calgary-jan-2026')
  AND sort_order = 3;

-- Update item 4: Blitz Demos & Community Voting -> Networking and Judging (7:30-7:45 PM MST)
UPDATE agenda_items
SET 
  title = 'Networking and Judging',
  description = 'Network with other attendees while judges evaluate the builds.',
  start_time = '2026-01-29T02:30:00Z',
  end_time = '2026-01-29T02:45:00Z',
  sort_order = 4
WHERE event_id IN (SELECT id FROM events WHERE slug = 'calgary-jan-2026')
  AND sort_order = 4;

-- Update item 5: Networking & Tear-Down -> Build Showcase (7:45-8:00 PM MST)
UPDATE agenda_items
SET 
  title = 'Build Showcase',
  description = 'Quick demos from each pod followed by community voting. Prizes awarded to winners.',
  start_time = '2026-01-29T02:45:00Z',
  end_time = '2026-01-29T03:00:00Z',
  sort_order = 5
WHERE event_id IN (SELECT id FROM events WHERE slug = 'calgary-jan-2026')
  AND sort_order = 5;

-- Insert item 6: Wind-Down (8:00-8:30 PM MST) if it doesn't exist
INSERT INTO agenda_items (event_id, title, description, start_time, end_time, sort_order)
SELECT 
  id,
  'Wind-Down',
  'Continue networking and share contact information.',
  '2026-01-29T03:00:00Z',
  '2026-01-29T03:30:00Z',
  6
FROM events
WHERE slug = 'calgary-jan-2026'
AND NOT EXISTS (
  SELECT 1 FROM agenda_items 
  WHERE event_id IN (SELECT id FROM events WHERE slug = 'calgary-jan-2026')
  AND sort_order = 6
);

-- Verify the updates
SELECT 
  title,
  description,
  speaker,
  start_time,
  end_time,
  sort_order
FROM agenda_items
WHERE event_id IN (SELECT id FROM events WHERE slug = 'calgary-jan-2026')
ORDER BY sort_order;

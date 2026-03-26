-- ============================================================
-- Seed planned_events — Shanghai calendar
-- Run in Supabase SQL Editor after running the migrations.
-- ============================================================

INSERT INTO planned_events (title, event_date, start_time, end_time, venue, address, notes, confirmed, city)
VALUES
  (
    'Cursor Shanghai Meetup #3',
    '2026-03-25',
    '18:00',
    '21:00',
    'TBD',          -- update when venue is confirmed
    'Address TBA (Shanghai, China)',
    'Theme: TBD',
    false,
    'Shanghai'
  )
ON CONFLICT DO NOTHING;

-- ── Add future Shanghai events below ─────────────────────────
-- INSERT INTO planned_events (title, event_date, start_time, end_time, venue, address, notes, confirmed, city)
-- VALUES ('Cursor Shanghai Meetup #4', '2026-04-29', '18:00', '21:00', 'TBD', 'Address TBA (Shanghai, China)', '', false, 'Shanghai');

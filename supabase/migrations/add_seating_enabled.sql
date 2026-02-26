-- Add seating_enabled column to events table
-- Controls whether seating features (tables, QR, smart seating) are shown to attendees
ALTER TABLE events ADD COLUMN IF NOT EXISTS seating_enabled BOOLEAN NOT NULL DEFAULT TRUE;

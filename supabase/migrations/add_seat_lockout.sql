-- Add seat_lockout_active field to events table
-- When true, attendees in approved groups see a blocking overlay with their table assignment
ALTER TABLE events ADD COLUMN IF NOT EXISTS seat_lockout_active BOOLEAN NOT NULL DEFAULT false;


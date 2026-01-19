-- Add timezone field to events table
-- Default to America/Edmonton (Mountain Time) for existing events
ALTER TABLE events ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Edmonton';

-- Add comment
COMMENT ON COLUMN events.timezone IS 'IANA timezone identifier (e.g., America/Edmonton) for the event location';

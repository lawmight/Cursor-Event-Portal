-- Add "archived" to the events.status CHECK constraint.
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check;

ALTER TABLE events
ADD CONSTRAINT events_status_check
CHECK (status IN ('draft', 'published', 'active', 'completed', 'archived'));

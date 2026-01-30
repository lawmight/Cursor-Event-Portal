-- Enable realtime for surveys and events tables
-- These were missing from the publication, causing survey popup
-- and toggle changes to never reach attendee clients via realtime
ALTER PUBLICATION supabase_realtime ADD TABLE surveys;
ALTER PUBLICATION supabase_realtime ADD TABLE events;

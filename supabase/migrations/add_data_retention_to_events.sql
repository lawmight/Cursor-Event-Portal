-- Add data retention policy field to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS data_retention_days INTEGER NOT NULL DEFAULT 60;

-- Add comment explaining the retention policy
COMMENT ON COLUMN events.data_retention_days IS 'Number of days after event end_time to retain attendee intake data. After this period, intake data (goals, offers) will be automatically deleted. Default is 60 days.';

-- Add survey_popup_visible field to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS survey_popup_visible BOOLEAN NOT NULL DEFAULT false;

-- Add index for quick lookup
CREATE INDEX IF NOT EXISTS idx_events_survey_popup ON events(id) WHERE survey_popup_visible = true;

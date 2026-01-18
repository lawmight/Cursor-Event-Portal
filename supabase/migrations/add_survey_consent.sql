-- Add survey_consent_at field to registrations table for PIPEDA compliance
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS survey_consent_at TIMESTAMPTZ;

-- Add index for querying consent status
CREATE INDEX IF NOT EXISTS idx_registrations_survey_consent ON registrations(event_id, survey_consent_at) WHERE survey_consent_at IS NOT NULL;


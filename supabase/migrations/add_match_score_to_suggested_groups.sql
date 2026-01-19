-- Add match_score to suggested_groups table
ALTER TABLE suggested_groups
ADD COLUMN IF NOT EXISTS match_score NUMERIC(5, 2);

-- Add index for sorting by score
CREATE INDEX IF NOT EXISTS idx_suggested_groups_match_score ON suggested_groups(event_id, match_score DESC NULLS LAST);

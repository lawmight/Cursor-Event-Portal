-- Add table_number field to suggested_groups for table assignments
ALTER TABLE suggested_groups ADD COLUMN IF NOT EXISTS table_number INTEGER;

-- Create index for querying by table number
CREATE INDEX IF NOT EXISTS idx_suggested_groups_table_number ON suggested_groups(event_id, table_number) WHERE table_number IS NOT NULL;

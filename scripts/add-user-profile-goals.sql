-- Add goals and offers columns to users table for persistent profile data
-- This allows users' goals/offers to persist across events and sessions

-- Add columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS goals TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS goals_other TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS offers TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS offers_other TEXT;

-- Create an index for faster querying by goals (for future matching features)
CREATE INDEX IF NOT EXISTS idx_users_goals ON users USING GIN (goals);
CREATE INDEX IF NOT EXISTS idx_users_offers ON users USING GIN (offers);

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

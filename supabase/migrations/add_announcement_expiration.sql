-- Add expires_at column to announcements table
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Create index for better performance when filtering by expiration
CREATE INDEX IF NOT EXISTS idx_announcements_expires_at ON announcements(expires_at);

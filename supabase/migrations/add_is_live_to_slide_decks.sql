-- Add is_live column to slide_decks table
ALTER TABLE slide_decks 
ADD COLUMN IF NOT EXISTS is_live BOOLEAN NOT NULL DEFAULT false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_slide_decks_is_live ON slide_decks(is_live);

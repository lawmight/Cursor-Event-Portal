-- Add current_page column to slide_decks for admin-controlled slide sync
ALTER TABLE slide_decks ADD COLUMN IF NOT EXISTS current_page integer DEFAULT 1;

-- Add comment
COMMENT ON COLUMN slide_decks.current_page IS 'Current page being displayed by admin, synced to attendees in real-time';

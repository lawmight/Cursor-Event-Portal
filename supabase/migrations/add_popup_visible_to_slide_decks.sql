-- Add popup_visible column to slide_decks table for right-center popup visibility
ALTER TABLE slide_decks 
ADD COLUMN IF NOT EXISTS popup_visible BOOLEAN NOT NULL DEFAULT false;

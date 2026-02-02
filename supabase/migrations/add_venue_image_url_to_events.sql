-- Add venue_image_url column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_image_url TEXT DEFAULT NULL;

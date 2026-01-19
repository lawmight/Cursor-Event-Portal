-- Add image_url column to agenda_items for hover preview images
ALTER TABLE agenda_items ADD COLUMN IF NOT EXISTS image_url text;

-- Add comment
COMMENT ON COLUMN agenda_items.image_url IS 'URL to preview image shown on hover';

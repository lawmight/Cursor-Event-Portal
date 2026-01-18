-- Add is_live field to slides table
ALTER TABLE slides ADD COLUMN IF NOT EXISTS is_live BOOLEAN NOT NULL DEFAULT false;

-- Create index for querying live slides
CREATE INDEX IF NOT EXISTS idx_slides_is_live ON slides(event_id, is_live) WHERE is_live = true;

-- Update RLS policies for slides
ALTER TABLE slides ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view slides
CREATE POLICY "Slides are viewable by everyone" ON slides FOR SELECT USING (true);

-- Allow service role to manage slides
CREATE POLICY "Slides can be managed by service role" ON slides FOR ALL USING (true);

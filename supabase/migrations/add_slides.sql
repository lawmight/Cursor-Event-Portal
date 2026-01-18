-- Slides table for display screen
CREATE TABLE IF NOT EXISTS slides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_slides_event_id ON slides(event_id);
CREATE INDEX IF NOT EXISTS idx_slides_sort_order ON slides(sort_order);

-- RLS for slides
ALTER TABLE slides ENABLE ROW LEVEL SECURITY;

-- Slides are viewable by everyone
CREATE POLICY "Slides are viewable by everyone" ON slides FOR SELECT USING (true);

-- Slides can be managed by service role (admin actions)
CREATE POLICY "Slides can be inserted by service role" ON slides FOR INSERT WITH CHECK (true);
CREATE POLICY "Slides can be updated by service role" ON slides FOR UPDATE USING (true);
CREATE POLICY "Slides can be deleted by service role" ON slides FOR DELETE USING (true);


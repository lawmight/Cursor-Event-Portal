-- Four features migration: timer, help requests, event series

-- Timer: columns on events
ALTER TABLE events ADD COLUMN IF NOT EXISTS timer_label TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS timer_end_time TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS timer_active BOOLEAN NOT NULL DEFAULT FALSE;

-- Help Requests
DO $$
BEGIN
  CREATE TYPE help_request_status AS ENUM ('waiting','helping','resolved','cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS help_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  status help_request_status NOT NULL DEFAULT 'waiting',
  claimed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_help_requests_event ON help_requests(event_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_status ON help_requests(status);

ALTER TABLE help_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "help_requests_select" ON help_requests FOR SELECT USING (true);
CREATE POLICY "help_requests_insert" ON help_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "help_requests_update" ON help_requests FOR UPDATE USING (true);
CREATE POLICY "help_requests_delete" ON help_requests FOR DELETE USING (true);

-- Event Series
CREATE TABLE IF NOT EXISTS event_series (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE events ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES event_series(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_events_series ON events(series_id);

ALTER TABLE event_series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "series_select" ON event_series FOR SELECT USING (true);
CREATE POLICY "series_insert" ON event_series FOR INSERT WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE help_requests;

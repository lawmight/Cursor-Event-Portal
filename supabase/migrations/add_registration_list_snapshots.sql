-- ============================================================================
-- REGISTRATION LIST SNAPSHOTS
-- ============================================================================
-- Stores point-in-time snapshots of the full registration + check-in list
-- so admins can preserve the attendee record even after the event ends or
-- registrations are cleared.
-- ============================================================================

CREATE TABLE IF NOT EXISTS registration_list_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  total_registered INTEGER NOT NULL DEFAULT 0,
  total_checked_in INTEGER NOT NULL DEFAULT 0,
  -- JSONB array of attendee objects:
  -- { user_id, name, email, registered_at, checked_in_at, source }
  attendees JSONB NOT NULL DEFAULT '[]',
  label TEXT, -- optional admin note / timestamp label
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registration_list_snapshots_event_id
  ON registration_list_snapshots(event_id);

CREATE INDEX IF NOT EXISTS idx_registration_list_snapshots_saved_at
  ON registration_list_snapshots(saved_at);

-- RLS
ALTER TABLE registration_list_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Registration list snapshots are viewable by everyone"
  ON registration_list_snapshots FOR SELECT USING (true);

CREATE POLICY "Registration list snapshots can be inserted by service role"
  ON registration_list_snapshots FOR INSERT WITH CHECK (true);

CREATE POLICY "Registration list snapshots can be deleted by service role"
  ON registration_list_snapshots FOR DELETE USING (true);

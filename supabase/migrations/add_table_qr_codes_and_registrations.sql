-- Add table-specific QR codes and table registrations for seating

CREATE TABLE IF NOT EXISTS table_qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  qr_image_url TEXT,
  storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, table_number)
);

CREATE INDEX IF NOT EXISTS idx_table_qr_codes_event_id ON table_qr_codes(event_id);

CREATE TABLE IF NOT EXISTS table_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'qr' CHECK (source IN ('qr', 'smart_seating')),
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_table_registrations_event_id ON table_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_table_registrations_user_id ON table_registrations(user_id);

ALTER TABLE events ADD COLUMN IF NOT EXISTS smart_seating_active BOOLEAN NOT NULL DEFAULT FALSE;

-- RLS
ALTER TABLE table_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Table QR codes are viewable by everyone" ON table_qr_codes FOR SELECT USING (true);
CREATE POLICY "Table QR codes can be inserted by service role" ON table_qr_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "Table QR codes can be updated by service role" ON table_qr_codes FOR UPDATE USING (true);
CREATE POLICY "Table QR codes can be deleted by service role" ON table_qr_codes FOR DELETE USING (true);

CREATE POLICY "Table registrations are viewable by everyone" ON table_registrations FOR SELECT USING (true);
CREATE POLICY "Table registrations can be inserted by service role" ON table_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Table registrations can be updated by service role" ON table_registrations FOR UPDATE USING (true);
CREATE POLICY "Table registrations can be deleted by service role" ON table_registrations FOR DELETE USING (true);

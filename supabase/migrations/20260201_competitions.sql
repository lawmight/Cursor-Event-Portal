-- Competition tables

CREATE TABLE competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  rules TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'voting', 'ended')),
  voting_mode TEXT NOT NULL DEFAULT 'group' CHECK (voting_mode IN ('group', 'judges', 'both')),
  winner_entry_id UUID,
  winner_method TEXT CHECK (winner_method IN ('auto', 'manual')),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  max_entries INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE competition_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  repo_url TEXT NOT NULL,
  project_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(competition_id, user_id)
);

CREATE TABLE competition_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES competition_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INT NOT NULL DEFAULT 1 CHECK (score >= 1 AND score <= 5),
  is_judge BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(competition_id, user_id, entry_id)
);

-- Add FK for winner_entry_id after competition_entries exists
ALTER TABLE competitions
  ADD CONSTRAINT competitions_winner_entry_id_fkey
  FOREIGN KEY (winner_entry_id) REFERENCES competition_entries(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_votes ENABLE ROW LEVEL SECURITY;

-- Permissive public read
CREATE POLICY "Public read competitions" ON competitions FOR SELECT USING (true);
CREATE POLICY "Public read competition_entries" ON competition_entries FOR SELECT USING (true);
CREATE POLICY "Public read competition_votes" ON competition_votes FOR SELECT USING (true);

-- Service role write (all operations)
CREATE POLICY "Service write competitions" ON competitions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write competition_entries" ON competition_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write competition_votes" ON competition_votes FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE competitions;
ALTER PUBLICATION supabase_realtime ADD TABLE competition_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE competition_votes;

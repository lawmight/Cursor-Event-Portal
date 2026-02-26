-- Add top3 voting mode support to competitions
-- This mode: admin picks top 3 finalists, then both group and admin vote separately,
-- yielding two prizes: a People's Choice and an Admin Pick.

ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS top3_entry_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS group_winner_entry_id UUID REFERENCES competition_entries(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS admin_winner_entry_id UUID REFERENCES competition_entries(id) ON DELETE SET NULL;

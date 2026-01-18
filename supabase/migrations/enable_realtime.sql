-- Enable Realtime for tables that need live updates
-- This migration enables Supabase Realtime on tables used by attendee dashboards
-- Run each statement individually if some tables don't exist yet

-- Enable realtime for announcements (broadcasts)
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;

-- Enable realtime for polls and poll votes (live polling)
ALTER PUBLICATION supabase_realtime ADD TABLE polls;
ALTER PUBLICATION supabase_realtime ADD TABLE poll_votes;

-- Enable realtime for questions and answers (Q&A)
ALTER PUBLICATION supabase_realtime ADD TABLE questions;
ALTER PUBLICATION supabase_realtime ADD TABLE question_upvotes;
ALTER PUBLICATION supabase_realtime ADD TABLE answers;

-- Enable realtime for agenda items (schedule updates)
ALTER PUBLICATION supabase_realtime ADD TABLE agenda_items;

-- Enable realtime for groups (smart seating)
ALTER PUBLICATION supabase_realtime ADD TABLE suggested_groups;
ALTER PUBLICATION supabase_realtime ADD TABLE suggested_group_members;

-- NOTE: The slides table may not exist yet. Run this separately after creating the slides table:
-- ALTER PUBLICATION supabase_realtime ADD TABLE slides;

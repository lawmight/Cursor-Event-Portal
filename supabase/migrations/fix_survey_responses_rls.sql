-- Ensure survey_responses RLS policies are correct
-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Survey responses are viewable by everyone" ON survey_responses;
DROP POLICY IF EXISTS "Survey responses can be inserted by service role" ON survey_responses;

-- Recreate policies
CREATE POLICY "Survey responses are viewable by everyone" 
  ON survey_responses 
  FOR SELECT 
  USING (true);

CREATE POLICY "Survey responses can be inserted by service role" 
  ON survey_responses 
  FOR INSERT 
  WITH CHECK (true);

-- Add admin_code column to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS admin_code TEXT;

-- Generate random 8-digit codes for existing events that don't have one
UPDATE events 
SET admin_code = LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0')
WHERE admin_code IS NULL;

-- Make admin_code required and unique
ALTER TABLE events 
ALTER COLUMN admin_code SET NOT NULL;

-- Add unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS events_admin_code_unique ON events(admin_code);

-- Function to generate a new unique 8-digit admin code
CREATE OR REPLACE FUNCTION generate_admin_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate random 8-digit code
    new_code := LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0');
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM events WHERE admin_code = new_code) INTO exists_check;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

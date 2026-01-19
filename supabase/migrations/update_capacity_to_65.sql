-- Update default capacity to 65
ALTER TABLE events 
ALTER COLUMN capacity SET DEFAULT 65;

-- Update existing events to have capacity of 65 if they have the old default of 50
UPDATE events 
SET capacity = 65 
WHERE capacity = 50;

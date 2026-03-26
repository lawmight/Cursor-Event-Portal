-- First, check current capacity
SELECT id, slug, name, capacity FROM events WHERE slug = 'shanghai-mar-2026';

-- Update the capacity to 65
UPDATE events 
SET capacity = 65 
WHERE slug = 'shanghai-mar-2026';

-- Verify the update
SELECT id, slug, name, capacity FROM events WHERE slug = 'shanghai-mar-2026';

-- If you want to update ALL events to 65:
-- UPDATE events SET capacity = 65;

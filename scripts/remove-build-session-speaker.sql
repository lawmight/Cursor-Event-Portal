-- Remove speaker from "Build Session" agenda item
-- This makes it a group session without a designated lead

UPDATE agenda_items
SET speaker = NULL
WHERE LOWER(title) = LOWER('Build Session')
  AND speaker IS NOT NULL;

-- Verify the update
SELECT id, title, speaker, start_time, end_time
FROM agenda_items
WHERE LOWER(title) = LOWER('Build Session');

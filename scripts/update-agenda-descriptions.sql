-- Update agenda item descriptions to be more public-facing, concise, and professional

-- Mingling & Networking
UPDATE agenda_items
SET description = 'Connect with fellow developers. Collaboration pods available.'
WHERE LOWER(title) = LOWER('Mingling & Networking');

-- Welcome & Introductions
UPDATE agenda_items
SET description = 'Event introduction and welcome.'
WHERE LOWER(title) = LOWER('Welcome & Introductions');

-- Short Demos
UPDATE agenda_items
SET description = 'Quick demos showcasing Cursor capabilities.'
WHERE LOWER(title) = LOWER('Short Demos');

-- Build Session
UPDATE agenda_items
SET description = 'Collaborative building session. Work with your pod and get help from facilitators.'
WHERE LOWER(title) = LOWER('Build Session');

-- Blitz Demos & Community Voting
UPDATE agenda_items
SET description = 'Quick demos from each pod followed by community voting. Prizes awarded to winners.'
WHERE LOWER(title) = LOWER('Blitz Demos & Community Voting');

-- Networking & Tear-Down
UPDATE agenda_items
SET description = 'Continue networking and share contact information.'
WHERE LOWER(title) = LOWER('Networking & Tear-Down');

-- Verify the updates
SELECT title, description, speaker
FROM agenda_items
ORDER BY sort_order;

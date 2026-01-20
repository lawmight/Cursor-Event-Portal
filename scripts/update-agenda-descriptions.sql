-- Update agenda item descriptions to be more public-facing with appropriate substance

-- Mingling & Networking
UPDATE agenda_items
SET description = 'Arrive early and connect with fellow developers. The room is set up with collaboration pods for small group discussions.'
WHERE LOWER(title) = LOWER('Mingling & Networking');

-- Welcome & Introductions
UPDATE agenda_items
SET description = 'Brief introduction to the event, agenda overview, and what to expect throughout the evening.'
WHERE LOWER(title) = LOWER('Welcome & Introductions');

-- Short Demos
UPDATE agenda_items
SET description = 'Quick demonstrations showcasing what''s possible with Cursor. Each demo runs up to 5 minutes.'
WHERE LOWER(title) = LOWER('Short Demos');

-- Build Session
UPDATE agenda_items
SET description = 'Collaborative building session where you work with your pod to create something together. Facilitators will be available to help and answer questions.'
WHERE LOWER(title) = LOWER('Build Session');

-- Blitz Demos & Community Voting
UPDATE agenda_items
SET description = 'Each pod presents a quick demo of what they built. The community votes on their favorites, with prizes awarded to the winners.'
WHERE LOWER(title) = LOWER('Blitz Demos & Community Voting');

-- Networking & Tear-Down
UPDATE agenda_items
SET description = 'Continue networking with other attendees, exchange contact information, and connect with the community.'
WHERE LOWER(title) = LOWER('Networking & Tear-Down');

-- Verify the updates
SELECT title, description, speaker
FROM agenda_items
ORDER BY sort_order;

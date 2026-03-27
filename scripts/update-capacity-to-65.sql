-- Legacy helper: update January 2026 event capacity to 65
UPDATE events
SET capacity = 65
WHERE slug = 'shanghai-jan-2026';

-- Rebrand active event and venue defaults from Calgary/Canada to Shanghai/China.
-- This migration updates current rows only and preserves historical migration files.

UPDATE public.events
SET
  slug = CASE slug
    WHEN 'calgary-jan-2026' THEN 'shanghai-jan-2026'
    WHEN 'calgary-feb-2026' THEN 'shanghai-feb-2026'
    WHEN 'calgary-march-2026' THEN 'shanghai-march-2026'
    ELSE slug
  END,
  name = CASE slug
    WHEN 'calgary-jan-2026' THEN 'Cursor Shanghai January 2026'
    WHEN 'calgary-feb-2026' THEN 'Cursor Shanghai February 2026'
    WHEN 'calgary-march-2026' THEN 'Cursor Shanghai March 2026'
    ELSE name
  END,
  venue = COALESCE(venue, 'Venue TBA'),
  address = 'Address TBA (Shanghai, China)',
  timezone = 'Asia/Shanghai'
WHERE slug IN ('calgary-jan-2026', 'calgary-feb-2026', 'calgary-march-2026');

UPDATE public.events
SET
  venue = 'Venue TBA',
  address = 'Address TBA (Shanghai, China)',
  timezone = 'Asia/Shanghai'
WHERE slug IN ('shanghai-jan-2026', 'shanghai-feb-2026', 'shanghai-march-2026');

UPDATE public.app_settings
SET
  value = CASE value
    WHEN 'calgary-jan-2026' THEN 'shanghai-jan-2026'
    WHEN 'calgary-feb-2026' THEN 'shanghai-feb-2026'
    WHEN 'calgary-march-2026' THEN 'shanghai-march-2026'
    ELSE value
  END,
  updated_at = NOW()
WHERE key = 'active_event_slug';

UPDATE public.venues
SET
  name = CASE name
    WHEN 'Platform Calgary' THEN 'Shanghai Innovation Hub'
    WHEN 'Startup Edmonton' THEN 'Shenzhen Maker Commons'
    ELSE name
  END,
  address = CASE name
    WHEN 'Platform Calgary' THEN 'Address TBA (Shanghai, China)'
    WHEN 'Startup Edmonton' THEN 'Address TBA (Shenzhen, China)'
    ELSE COALESCE(address, 'Address TBA (Shanghai, China)')
  END,
  city = CASE city
    WHEN 'Calgary' THEN 'Shanghai'
    WHEN 'Edmonton' THEN 'Shenzhen'
    WHEN 'Vancouver' THEN 'Beijing'
    ELSE city
  END
WHERE city IN ('Calgary', 'Edmonton', 'Vancouver')
   OR name IN ('Platform Calgary', 'Startup Edmonton');

-- Bootstrap: create public.events and insert House 831 event.
-- Run this in Supabase SQL Editor only in a project where public.events does NOT exist yet.
-- (If events already exists, use set_house_831_venue_manual.sql or fix_jan_event_to_house831_feb.sql instead.)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'attendee' CHECK (role IN ('attendee', 'facilitator', 'staff', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  venue TEXT,
  address TEXT,
  capacity INTEGER NOT NULL DEFAULT 65,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'active', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  venue_image_url TEXT,
  admin_code TEXT,
  timezone TEXT DEFAULT 'America/Edmonton',
  data_retention_days INTEGER DEFAULT 60,
  seating_enabled BOOLEAN NOT NULL DEFAULT true,
  seat_lockout_active BOOLEAN NOT NULL DEFAULT false,
  smart_seating_active BOOLEAN NOT NULL DEFAULT false,
  survey_popup_visible BOOLEAN NOT NULL DEFAULT false,
  timer_label TEXT,
  timer_end_time TIMESTAMPTZ,
  timer_active BOOLEAN NOT NULL DEFAULT false,
  series_id UUID
);

-- Ensure admin_code has a value for the row we insert
ALTER TABLE public.events ALTER COLUMN admin_code SET DEFAULT LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0');

INSERT INTO public.events (
  slug, code, name, venue, address, venue_image_url,
  start_time, end_time, status, capacity
) VALUES (
  'calgary-feb-2026',
  'FEB2026',
  'Cursor Calgary February 2026',
  'House 831',
  '831 17 Ave SW, Calgary, AB T2T 0A1',
  '/house-831.webp',
  '2026-02-27T00:30:00Z',
  '2026-02-27T03:30:00Z',
  'published',
  65
) ON CONFLICT (slug) DO UPDATE SET
  venue = EXCLUDED.venue,
  address = EXCLUDED.address,
  venue_image_url = EXCLUDED.venue_image_url,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  name = EXCLUDED.name;

-- Make admin_code NOT NULL only if we're not breaking existing rows (optional)
-- UPDATE public.events SET admin_code = LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0') WHERE admin_code IS NULL;
-- ALTER TABLE public.events ALTER COLUMN admin_code SET NOT NULL;

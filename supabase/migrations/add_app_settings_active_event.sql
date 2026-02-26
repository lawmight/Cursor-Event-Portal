-- App settings: which event/venue is "active" for the attendee-facing side.
-- Admin can toggle this; homepage and any single entry point use it to send attendees to the right event.

CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Allow anyone to read (so homepage can show correct event link); only backend/admin updates via API.
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_settings_select" ON public.app_settings
  FOR SELECT USING (true);

CREATE POLICY "app_settings_update_authenticated" ON public.app_settings
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "app_settings_insert_authenticated" ON public.app_settings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Set default active event to House 831 (Feb 2026). Must match a slug in events.
INSERT INTO public.app_settings (key, value)
VALUES ('active_event_slug', 'calgary-feb-2026')
ON CONFLICT (key) DO NOTHING;

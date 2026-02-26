-- Ensure anyone (including anon) can read events so /calgary-feb-2026 and other event URLs work.
-- If RLS was enabled on events without this policy, getEventBySlug would return no rows and cause 404.

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;
CREATE POLICY "Events are viewable by everyone"
  ON public.events FOR SELECT USING (true);

-- Fresh databases may not have agenda_items / announcements / sessions until
-- schema.sql is applied. If an earlier migration failed on ALTER for a
-- missing table, this idempotent block completes RLS + read policies safely.

DO $$
BEGIN
  IF to_regclass('public.agenda_items') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.agenda_items ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Agenda items are viewable by everyone" ON public.agenda_items';
    EXECUTE $p$
      CREATE POLICY "Agenda items are viewable by everyone"
        ON public.agenda_items FOR SELECT USING (true)
    $p$;
  END IF;

  IF to_regclass('public.announcements') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Announcements are viewable by everyone" ON public.announcements';
    EXECUTE $p$
      CREATE POLICY "Announcements are viewable by everyone"
        ON public.announcements FOR SELECT USING (true)
    $p$;
  END IF;

  IF to_regclass('public.sessions') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

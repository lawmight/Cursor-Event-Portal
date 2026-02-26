-- PGRST116 is caused by 0 or 2+ rows for a slug when using .single().
-- Keep one event per slug (keep row with max id), then enforce unique slug.

DELETE FROM public.events a
USING public.events b
WHERE a.slug = b.slug
  AND a.id < b.id;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey) AND a.attname = 'slug'
    WHERE c.conrelid = 'public.events'::regclass AND c.contype = 'u'
  ) THEN
    ALTER TABLE public.events ADD CONSTRAINT events_slug_key UNIQUE (slug);
  END IF;
END $$;

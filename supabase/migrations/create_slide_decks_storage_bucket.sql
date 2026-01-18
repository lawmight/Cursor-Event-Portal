-- Storage bucket for slide decks (PDFs)
insert into storage.buckets (id, name, public)
values ('slide-decks', 'slide-decks', true)
on conflict (id) do update set public = excluded.public;

-- Public read access
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Slide decks are publicly readable'
  ) then
    create policy "Slide decks are publicly readable"
    on storage.objects
    for select
    using (bucket_id = 'slide-decks');
  end if;
end $$;

-- Service role can manage deck files
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Slide decks are manageable by service role'
  ) then
    create policy "Slide decks are manageable by service role"
    on storage.objects
    for all
    using (bucket_id = 'slide-decks' and auth.role() = 'service_role')
    with check (bucket_id = 'slide-decks' and auth.role() = 'service_role');
  end if;
end $$;

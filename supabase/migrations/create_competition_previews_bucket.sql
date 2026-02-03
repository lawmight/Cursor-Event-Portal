-- Storage bucket for competition entry preview images (uploaded by attendees)
insert into storage.buckets (id, name, public)
values ('competition-previews', 'competition-previews', true)
on conflict (id) do update set public = excluded.public;

-- Public read for preview images
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Competition previews are publicly readable'
  ) then
    create policy "Competition previews are publicly readable"
    on storage.objects
    for select
    using (bucket_id = 'competition-previews');
  end if;
end $$;

-- Service role can insert/update/delete (API uploads)
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Competition previews manageable by service role'
  ) then
    create policy "Competition previews manageable by service role"
    on storage.objects
    for all
    using (bucket_id = 'competition-previews' and auth.role() = 'service_role')
    with check (bucket_id = 'competition-previews' and auth.role() = 'service_role');
  end if;
end $$;

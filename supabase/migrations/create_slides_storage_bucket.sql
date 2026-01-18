-- Storage bucket for slide images
insert into storage.buckets (id, name, public)
values ('slides', 'slides', true)
on conflict (id) do update set public = excluded.public;

-- Allow public read access to slides
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Slides are publicly readable'
  ) then
    create policy "Slides are publicly readable"
    on storage.objects
    for select
    using (bucket_id = 'slides');
  end if;
end $$;

-- Allow service role to manage slides
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Slides are manageable by service role'
  ) then
    create policy "Slides are manageable by service role"
    on storage.objects
    for all
    using (bucket_id = 'slides' and auth.role() = 'service_role')
    with check (bucket_id = 'slides' and auth.role() = 'service_role');
  end if;
end $$;

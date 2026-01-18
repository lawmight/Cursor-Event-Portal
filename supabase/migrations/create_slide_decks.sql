-- Slide deck storage (single PDF per event)
create table if not exists slide_decks (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references events(id) on delete cascade,
  pdf_url text not null,
  storage_path text not null,
  page_count integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id)
);

create index if not exists idx_slide_decks_event_id on slide_decks(event_id);

alter table slide_decks enable row level security;

create policy "Slide decks are viewable by everyone"
on slide_decks for select using (true);

create policy "Slide decks can be inserted by service role"
on slide_decks for insert with check (true);

create policy "Slide decks can be updated by service role"
on slide_decks for update using (true);

create policy "Slide decks can be deleted by service role"
on slide_decks for delete using (true);

-- Remove legacy per-slide table
drop table if exists slides cascade;

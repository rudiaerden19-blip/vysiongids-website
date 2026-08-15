-- Type keuken (optioneel) op zaakprofiel
alter table public.gids_listings
  add column if not exists cuisine_type text;

create index if not exists gids_listings_cuisine_type_idx
  on public.gids_listings (cuisine_type)
  where cuisine_type is not null;

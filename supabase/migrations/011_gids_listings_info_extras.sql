-- Extra INFO-blokken op zaakpagina (#info): specialiteiten, vacature, cadeaubon.
alter table public.gids_listings
  add column if not exists info_extras jsonb;

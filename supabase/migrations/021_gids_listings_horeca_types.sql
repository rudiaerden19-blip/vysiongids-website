-- Meerdere horeca-types per zaak (kebab + frituur + pizza, …)
alter table public.gids_listings
  add column if not exists horeca_types text[] default null;

comment on column public.gids_listings.horeca_types is
  'Alle gekozen horeca-types; kolom type = primair (eerste). Leeg = alleen type-kolom.';

create index if not exists gids_listings_horeca_types_gin
  on public.gids_listings using gin (horeca_types);

grant select (horeca_types) on public.gids_listings to anon, authenticated;

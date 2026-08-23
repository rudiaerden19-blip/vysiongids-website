-- Eerste login na claim: standaard-PIN 123456 → verplicht nieuwe PIN in beheer.

alter table public.gids_listings
  add column if not exists pin_must_change boolean not null default false;

comment on column public.gids_listings.pin_must_change is
  'True na activatie claim met standaard-PIN; eigenaar moet nieuwe 6-cijfer-PIN kiezen.';

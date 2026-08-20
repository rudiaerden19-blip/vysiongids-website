-- Premium Vysiongids (vacatures + zoekertjes): €50/jaar — handmatig of via betaling later.

alter table public.gids_listings
  add column if not exists premium_member boolean not null default false;

comment on column public.gids_listings.premium_member is
  'Betalend lid Vysiongids: vacatures, zoekertjes en andere premiumvoordelen.';

-- Premium abonnement: betaaldatum, verval (+365 dagen), pauze (medewerkersbeheer).

alter table public.gids_listings
  add column if not exists premium_paid_at timestamptz,
  add column if not exists premium_expires_at timestamptz,
  add column if not exists premium_paused boolean not null default false;

comment on column public.gids_listings.premium_paid_at is
  'Laatste (of eerste) betaling premium lidmaatschap.';
comment on column public.gids_listings.premium_expires_at is
  'Premium geldig tot (volgende betaling); typisch paid_at + 365 dagen.';
comment on column public.gids_listings.premium_paused is
  'Premium tijdelijk gepauzeerd door medewerker — geen vacatures/zoekertjes.';

-- Gratis diensten-lidmaatschap (geen Stripe) per rij
alter table public.gids_listings
  add column if not exists diensten_complimentary boolean not null default false;

comment on column public.gids_listings.diensten_complimentary is 'true = geen checkout; activeert lidmaatschap bij registratie';

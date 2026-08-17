-- Afhaaltijd (min–max), optioneel naast levertijd
alter table public.gids_listings
  add column if not exists pickup_time_min int,
  add column if not exists pickup_time_max int;

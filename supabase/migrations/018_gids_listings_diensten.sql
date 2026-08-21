-- Diensten / leveranciers (apart van horeca-zoeken)

alter table public.gids_listings
  add column if not exists listing_segment text not null default 'horeca'
    check (listing_segment in ('horeca', 'diensten'));

alter table public.gids_listings
  add column if not exists service_categories text[] not null default '{}';

alter table public.gids_listings
  add column if not exists service_description text;

alter table public.gids_listings
  add column if not exists diensten_paid_at timestamptz;

alter table public.gids_listings
  add column if not exists diensten_expires_at timestamptz;

create index if not exists gids_listings_segment_idx on public.gids_listings (listing_segment);

-- Foto's: horeca max 3, diensten tot 10 (sort_order 0–9)
alter table public.gids_listing_photos
  drop constraint if exists gids_listing_photos_sort_order_check;

alter table public.gids_listing_photos
  add constraint gids_listing_photos_sort_order_check
  check (sort_order >= 0 and sort_order <= 9);

comment on column public.gids_listings.listing_segment is 'horeca = gids-zoeken; diensten = publiciteit & leveranciers';
comment on column public.gids_listings.service_categories is 'Slugs uit gids-service-categories.ts';

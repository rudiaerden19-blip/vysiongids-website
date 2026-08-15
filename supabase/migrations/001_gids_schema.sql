-- Vysiongids — standalone schema (geen tenant_slug / geen kassa)

create extension if not exists pgcrypto;

create table if not exists public.gids_listings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  name_normalized text not null unique,
  pin_hash text not null,
  type text not null,
  city text not null,
  postcode text not null,
  province text,
  address text not null,
  order_url text not null,
  website text,
  phone text,
  email text,
  opening_hours text,
  closed_days text,
  hours_by_day jsonb,
  amenities jsonb,
  rating_avg numeric(2, 1) default 0,
  rating_count int default 0,
  delivery_time_min int,
  delivery_time_max int,
  delivery_fee_eur numeric(8, 2),
  min_order_eur numeric(8, 2),
  pickup_enabled boolean default true,
  delivery_enabled boolean default true,
  lat double precision,
  lng double precision,
  status text not null default 'published' check (status in ('published', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gids_listings_status_idx on public.gids_listings (status);
create index if not exists gids_listings_city_idx on public.gids_listings (city);
create index if not exists gids_listings_type_idx on public.gids_listings (type);

create table if not exists public.gids_listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.gids_listings (id) on delete cascade,
  sort_order smallint not null check (sort_order >= 0 and sort_order <= 2),
  storage_path text not null,
  public_url text not null,
  created_at timestamptz not null default now(),
  unique (listing_id, sort_order)
);

create or replace function public.gids_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists gids_listings_updated_at on public.gids_listings;
create trigger gids_listings_updated_at
  before update on public.gids_listings
  for each row execute function public.gids_set_updated_at();

-- Publiek: alleen published listings lezen (anon). Schrijven later via service role + Next.js API.
alter table public.gids_listings enable row level security;
alter table public.gids_listing_photos enable row level security;

create policy "Public read published listings"
  on public.gids_listings for select
  to anon, authenticated
  using (status = 'published');

create policy "Public read photos of published listings"
  on public.gids_listing_photos for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.gids_listings l
      where l.id = listing_id and l.status = 'published'
    )
  );

-- Digitaal menu per zaak (categorieën + producten), los van OrderVysion-kassa.

alter table public.gids_listings
  add column if not exists menu_catalog_active boolean not null default false;

create table if not exists public.gids_menu_categories (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.gids_listings (id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists gids_menu_categories_listing_idx on public.gids_menu_categories (listing_id);

create table if not exists public.gids_menu_products (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.gids_listings (id) on delete cascade,
  category_id uuid not null references public.gids_menu_categories (id) on delete cascade,
  name text not null,
  description text,
  price_eur numeric(10, 2),
  image_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists gids_menu_products_listing_idx on public.gids_menu_products (listing_id);
create index if not exists gids_menu_products_category_idx on public.gids_menu_products (category_id);

alter table public.gids_menu_categories enable row level security;
alter table public.gids_menu_products enable row level security;

create policy "Public read menu categories"
  on public.gids_menu_categories for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.gids_listings l
      where l.id = listing_id and l.status = 'published'
    )
  );

create policy "Public read menu products"
  on public.gids_menu_products for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.gids_listings l
      where l.id = listing_id and l.status = 'published' and l.menu_catalog_active = true
    )
    and is_active = true
  );

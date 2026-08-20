-- Zoekertjes (classified ads) — premium horeca-leden

create table if not exists public.gids_zoekertjes (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.gids_listings (id) on delete cascade,
  title text not null check (char_length(title) <= 60),
  description text not null check (char_length(description) <= 4000),
  category text not null,
  condition text,
  kind text,
  item_type text,
  brand text,
  price_class text not null default 'Bieden',
  status text not null default 'published' check (status in ('published', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gids_zoekertjes_listing_idx on public.gids_zoekertjes (listing_id);
create index if not exists gids_zoekertjes_status_idx on public.gids_zoekertjes (status);
create index if not exists gids_zoekertjes_created_idx on public.gids_zoekertjes (created_at desc);

create table if not exists public.gids_zoekertje_photos (
  id uuid primary key default gen_random_uuid(),
  zoekertje_id uuid not null references public.gids_zoekertjes (id) on delete cascade,
  sort_order smallint not null check (sort_order >= 0 and sort_order <= 23),
  storage_path text not null,
  public_url text not null,
  created_at timestamptz not null default now(),
  unique (zoekertje_id, sort_order)
);

drop trigger if exists gids_zoekertjes_updated_at on public.gids_zoekertjes;
create trigger gids_zoekertjes_updated_at
  before update on public.gids_zoekertjes
  for each row execute function public.gids_set_updated_at();

alter table public.gids_zoekertjes enable row level security;
alter table public.gids_zoekertje_photos enable row level security;

create policy "Public read published zoekertjes"
  on public.gids_zoekertjes for select
  to anon, authenticated
  using (status = 'published');

create policy "Public read zoekertje photos"
  on public.gids_zoekertje_photos for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.gids_zoekertjes z
      where z.id = zoekertje_id and z.status = 'published'
    )
  );

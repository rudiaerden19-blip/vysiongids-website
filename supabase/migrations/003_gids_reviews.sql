-- Vysiongids — klantreviews per listing

create table if not exists public.gids_reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.gids_listings (id) on delete cascade,
  rating smallint not null check (rating >= 1 and rating <= 5),
  reviewer_name text,
  body text not null check (char_length(trim(body)) >= 10 and char_length(body) <= 2000),
  created_at timestamptz not null default now()
);

create index if not exists gids_reviews_listing_created_idx
  on public.gids_reviews (listing_id, created_at desc);

create or replace function public.gids_refresh_listing_rating()
returns trigger
language plpgsql
as $$
declare
  lid uuid;
begin
  lid := coalesce(new.listing_id, old.listing_id);
  update public.gids_listings l
  set
    rating_avg = coalesce(
      (select round(avg(r.rating)::numeric, 1) from public.gids_reviews r where r.listing_id = lid),
      0
    ),
    rating_count = (select count(*)::int from public.gids_reviews r where r.listing_id = lid)
  where l.id = lid;
  return coalesce(new, old);
end;
$$;

drop trigger if exists gids_reviews_refresh_rating on public.gids_reviews;
create trigger gids_reviews_refresh_rating
  after insert or update or delete on public.gids_reviews
  for each row execute function public.gids_refresh_listing_rating();

alter table public.gids_reviews enable row level security;

create policy "Public read reviews of published listings"
  on public.gids_reviews for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.gids_listings l
      where l.id = listing_id and l.status = 'published'
    )
  );

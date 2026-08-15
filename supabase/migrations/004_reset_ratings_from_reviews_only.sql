-- Verwijder demo-/Google-achtige scores; alleen echte gids_reviews tellen mee.

update public.gids_listings l
set
  rating_avg = coalesce(
    (select round(avg(r.rating)::numeric, 1) from public.gids_reviews r where r.listing_id = l.id),
    0
  ),
  rating_count = (
    select count(*)::int from public.gids_reviews r where r.listing_id = l.id
  );

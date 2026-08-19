-- Verwijder per ongeluk gegeven 1-ster reviews (positieve tekst, aug 2026).
-- Slugs: frituur-aartselaar-aartselaar, frituur-t-bintje-alken
-- Rating op listing wordt automatisch bijgewerkt via trigger gids_reviews_refresh_rating.

-- 1) Controleren vóór delete:
SELECT l.slug, l.name, r.id, r.rating, r.reviewer_name, left(r.body, 120) AS body, r.created_at
FROM public.gids_reviews r
JOIN public.gids_listings l ON l.id = r.listing_id
WHERE l.slug IN ('frituur-aartselaar-aartselaar', 'frituur-t-bintje-alken')
ORDER BY l.slug, r.created_at DESC;

-- 2) Delete (alleen 1-ster bij deze twee zaken):
DELETE FROM public.gids_reviews r
USING public.gids_listings l
WHERE r.listing_id = l.id
  AND l.slug IN ('frituur-aartselaar-aartselaar', 'frituur-t-bintje-alken')
  AND r.rating = 1;

-- 3) Controleren na delete:
SELECT slug, name, rating_avg, rating_count
FROM public.gids_listings
WHERE slug IN ('frituur-aartselaar-aartselaar', 'frituur-t-bintje-alken');

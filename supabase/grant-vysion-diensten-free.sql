-- Gratis diensten-lidmaatschap voor Vysion (eigenaar / test).
-- Voer migratie 019 uit als kolom diensten_complimentary nog ontbreekt.

UPDATE public.gids_listings
SET
  diensten_complimentary = true,
  status = 'published',
  diensten_paid_at = COALESCE(diensten_paid_at, timezone('utc', now())),
  diensten_expires_at = timezone('utc', now()) + interval '10 years'
WHERE
  listing_segment = 'diensten'
  AND (
    name_normalized ILIKE '%vysion%'
    OR slug ILIKE '%vysion%'
    OR name ILIKE '%vysion%'
    OR email ILIKE '%@vysionhoreca.com'
  );

SELECT slug, name, status, diensten_complimentary, diensten_expires_at
FROM public.gids_listings
WHERE listing_segment = 'diensten'
  AND (
    name ILIKE '%vysion%'
    OR slug ILIKE '%vysion%'
    OR email ILIKE '%@vysionhoreca.com'
  );

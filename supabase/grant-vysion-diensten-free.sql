-- Gratis diensten-registratie voor Vysion (eigenaar / test).
-- Voer uit in Supabase SQL Editor ná aanmelden op /diensten/aanmelden,
-- of als profiel op hidden blijft na geannuleerde Stripe-betaling.
--
-- Werkt op alle gids_listings waar naam of slug "vysion" bevat en segment diensten is.
-- Pas het filter aan als je een andere testnaam gebruikt.

UPDATE public.gids_listings
SET
  status = 'published',
  diensten_paid_at = COALESCE(diensten_paid_at, timezone('utc', now())),
  diensten_expires_at = timezone('utc', now()) + interval '10 years'
WHERE
  listing_segment = 'diensten'
  AND (
    name_normalized ILIKE '%vysion%'
    OR slug ILIKE '%vysion%'
    OR name ILIKE '%vysion%'
  );

-- Controle
SELECT
  slug,
  name,
  status,
  listing_segment,
  diensten_paid_at,
  diensten_expires_at
FROM public.gids_listings
WHERE
  listing_segment = 'diensten'
  AND (
    name_normalized ILIKE '%vysion%'
    OR slug ILIKE '%vysion%'
    OR name ILIKE '%vysion%'
  );

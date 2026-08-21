-- Na migratie 018: anon SELECT op nieuwe kolommen (zelfde patroon als 017).
-- Voer uit in Supabase SQL Editor als publieke diensten-profielen geen data tonen.

GRANT SELECT (
  listing_segment,
  service_categories,
  service_description,
  diensten_paid_at,
  diensten_expires_at
) ON public.gids_listings TO anon, authenticated;

-- Leveringsstraal (km) per zaak — optioneel, ingesteld in registratie/beheer.
ALTER TABLE gids_listings
  ADD COLUMN IF NOT EXISTS delivery_radius_km numeric(5, 1);

COMMENT ON COLUMN gids_listings.delivery_radius_km IS 'Max. leverafstand in km vanaf zaakadres; NULL = niet getoond / niet ingesteld';

-- Verwijder ten onrechte gezet claimed_at (oude bug bij zaak toevoegen).
-- Claim-knop voor Vysion-lijst: pin_hash moet leeg blijven; zaken mét PIN → beheer/login, geen claim-formulier.

update public.gids_listings
set claimed_at = null
where pin_hash is not null
  and claimed_at is not null;

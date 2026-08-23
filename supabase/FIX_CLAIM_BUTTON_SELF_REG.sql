-- Alles wat ten onrechte claimed_at had (oude zaak-toevoegen bug): terug naar NULL.
-- Claim-knop terug; staff-lijst wit tot klant claimt (claimed_at + groene rij).

update public.gids_listings
set claimed_at = null
where pin_hash is not null
  and claimed_at is not null;

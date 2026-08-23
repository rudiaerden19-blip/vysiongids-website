-- Claim-knop op zoek/zaak: zichtbaar zolang claimed_at NULL is.
-- Zaak toevoegen zette ten onrechte meteen claimed_at; eigenaar = pin_hash.
-- Eenmalig: bestaande self-reg zaken weer claim-knop (claimed_at leeg, pin blijft).

update public.gids_listings
set claimed_at = null
where pin_hash is not null
  and claimed_at is not null;

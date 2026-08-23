-- Zaken die JIJ al geactiveerd/ geclaimd had: claimed_at terug (groene staff-rij + geen Claim-knop).
-- Voer uit NA een reset die claimed_at ten onrechte leegmaakte.

-- 1) Alles met goedgekeurde claim-aanvraag
update public.gids_listings l
set claimed_at = coalesce(l.claimed_at, now())
from public.gids_listing_claim_requests r
where r.listing_id = l.id
  and r.status = 'approved'
  and l.claimed_at is null;

-- 2) Bekende geactiveerde zaken (pas slugs aan indien nodig)
update public.gids_listings
set claimed_at = coalesce(claimed_at, now())
where claimed_at is null
  and (
    slug ilike '%nolim%'
    or name ilike '%nolim%'
    or slug ilike '%vysion%horeca%'
    or name ilike '%vysion%horeca%'
  );

-- Controle
select slug, name, claimed_at
from public.gids_listings
where slug ilike '%nolim%' or name ilike '%vysion%horeca%' or name ilike '%nolim%';

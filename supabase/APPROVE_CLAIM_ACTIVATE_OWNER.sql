-- Claim goedkeuren: standaard-PIN 123456 + verplicht wijzigen bij eerste login.
--
-- 1) Hash genereren (in repo-root):
--    node scripts/hash-gids-pin.mjs 123456
-- 2) Vervang :PIN_HASH, :LISTING_SLUG (en controleer pending claim).
-- 3) Na uitvoeren: homepage/zoek/zaak cache (max ~60s) of redeploy — claimed_at verbergt Claim-knop.

update public.gids_listings l
set
  pin_hash = ':PIN_HASH',
  claimed_at = coalesce(l.claimed_at, now()),
  pin_must_change = true,
  email = coalesce(nullif(trim(l.email), ''), r.contact_email),
  phone = coalesce(nullif(trim(l.phone), ''), r.contact_phone)
from public.gids_listing_claim_requests r
where l.slug = ':LISTING_SLUG'
  and r.listing_id = l.id
  and r.status = 'pending'
  and (l.pin_hash is null or trim(l.pin_hash) = '');

update public.gids_listing_claim_requests
set status = 'approved'
where listing_id = (select id from public.gids_listings where slug = ':LISTING_SLUG')
  and status = 'pending';

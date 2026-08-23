-- Claim goedkeuren: standaard-PIN 123456 + verplicht wijzigen bij eerste login.
--
-- 1) Hash genereren (in repo-root):
--    node scripts/hash-gids-pin.mjs 123456
-- 2) Vervang :PIN_HASH en :LISTING_ID (of slug) hieronder.

update public.gids_listings l
set
  pin_hash = ':PIN_HASH',
  claimed_at = coalesce(l.claimed_at, now()),
  email = coalesce(nullif(trim(l.email), ''), r.contact_email),
  phone = coalesce(nullif(trim(l.phone), ''), r.contact_phone)
from public.gids_listing_claim_requests r
where l.slug = 'frituur-nolim-pelt'
  and r.listing_id = l.id
  and r.status = 'pending';

update public.gids_listing_claim_requests
set status = 'approved'
where listing_id = (select id from public.gids_listings where slug = 'frituur-nolim-pelt')
  and status = 'pending';

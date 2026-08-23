-- Claim goedkeuren: standaard-PIN 123456 + verplicht wijzigen bij eerste login.
--
-- 1) Hash genereren (in repo-root):
--    node scripts/hash-gids-pin.mjs 123456
-- 2) Vervang :PIN_HASH en :LISTING_ID (of slug) hieronder.

update public.gids_listings
set
  pin_hash = ':PIN_HASH',
  pin_must_change = true,
  claimed_at = coalesce(claimed_at, now())
where slug = 'frituur-nolim-pelt'; -- pas slug aan

update public.gids_listing_claim_requests
set status = 'approved'
where listing_id = (select id from public.gids_listings where slug = 'frituur-nolim-pelt')
  and status = 'pending';

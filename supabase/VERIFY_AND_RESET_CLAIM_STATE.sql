-- 1) Diagnose: hoeveel zaken ten onrechte «geclaimd» in DB?
select
  count(*) filter (where claimed_at is not null) as met_claimed_at,
  count(*) filter (where claimed_at is null) as zonder_claimed_at,
  count(*) as totaal
from public.gids_listings
where status = 'published';

-- 2) De Pijl / andere: claimed_at moet NULL zijn voor Claim-knop
select slug, name, claimed_at, created_at
from public.gids_listings
where slug ilike '%pijl%' or name ilike '%pijl%';

-- 3) Reset (klant nog niet echt geclaimd via goedgekeurde aanvraag)
update public.gids_listings l
set claimed_at = null
where l.claimed_at is not null
  and not exists (
    select 1
    from public.gids_listing_claim_requests r
    where r.listing_id = l.id
      and r.status = 'approved'
  );

-- 4) Na reset: staff wit, zoekkaart toont «Claim je zaak»
select slug, name, claimed_at
from public.gids_listings
where status = 'published'
  and claimed_at is null
order by name
limit 20;

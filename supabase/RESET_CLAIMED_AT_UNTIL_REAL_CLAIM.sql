-- Claim-knop + witte staff-rij: claimed_at moet NULL zijn tot de klant echt claimt.
-- Voer uit in Supabase SQL Editor (productie). Daarna hard refresh zoek/ staff.

-- Optie A: alles resetten waar nog geen goedgekeurde claim in het systeem staat
update public.gids_listings l
set claimed_at = null
where l.claimed_at is not null
  and not exists (
    select 1
    from public.gids_listing_claim_requests r
    where r.listing_id = l.id
      and r.status = 'approved'
  );

-- Controle: deze zaken horen Claim-knop te tonen
-- select slug, name, claimed_at from public.gids_listings where slug like '%pijl%';

-- Pending claim-aanvragen per zaak (service role / Supabase dashboard)
select
  r.created_at,
  r.status,
  l.slug,
  l.name,
  l.city,
  r.contact_name,
  r.contact_email,
  r.contact_phone,
  r.btw_number,
  r.message
from public.gids_listing_claim_requests r
join public.gids_listings l on l.id = r.listing_id
where r.status = 'pending'
order by r.created_at desc;

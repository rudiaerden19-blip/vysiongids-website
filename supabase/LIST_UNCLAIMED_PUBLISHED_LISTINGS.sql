-- Zaken waar «Claim je zaak» zichtbaar is (published + claimed_at IS NULL)
select slug, name, city, created_at
from public.gids_listings
where status = 'published'
  and claimed_at is null
order by name;

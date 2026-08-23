-- Zaken waar «Claim je zaak» zichtbaar én het formulier werkt (geen eigenaar-PIN).
select slug, name, city, created_at
from public.gids_listings
where status = 'published'
  and claimed_at is null
  and (pin_hash is null or trim(pin_hash) = '')
order by name;

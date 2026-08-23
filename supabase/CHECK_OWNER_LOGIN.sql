-- Waarom login faalt? (Vysiongids Supabase)
select slug, name, name_normalized,
  pin_hash is not null as has_pin,
  pin_must_change,
  claimed_at
from public.gids_listings
where slug = 'frituur-nolim-pelt'
   or name ilike '%nolim%';

-- Login gebruikt exact name_normalized — log in met kolom "name" hierboven.

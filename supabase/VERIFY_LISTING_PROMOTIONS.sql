-- Promoties in Vysiongids — verificatie (Supabase SQL Editor)
-- Schema: geen migratie nodig behalve info_extras (011). Promotie = JSON-key.

-- 1) Kolom info_extras aanwezig?
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'gids_listings'
  and column_name = 'info_extras';

-- 2) Alle zaken met actieve promotie (tekst en/of foto)
select
  id,
  slug,
  name,
  info_extras -> 'promotion' as promotion
from public.gids_listings
where coalesce(info_extras -> 'promotion' ->> 'enabled', 'false') = 'true'
  and (
    length(trim(coalesce(info_extras -> 'promotion' ->> 'text', ''))) > 0
    or length(trim(coalesce(info_extras -> 'promotion' ->> 'imageUrl', ''))) > 0
  )
order by name;

-- 3) Eén zaak (slug invullen)
-- select info_extras -> 'promotion' from public.gids_listings where slug = 'jouw-slug';

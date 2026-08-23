-- Promoties: geen nieuwe kolom — object in info_extras JSON (promotion).
-- Vereist: info_extras jsonb (011). Dit script is idempotent.

alter table public.gids_listings
  add column if not exists info_extras jsonb;

comment on column public.gids_listings.info_extras is
  'INFO op zaakpagina: specialties, hiring, giftCard, promotion {enabled,text,imageUrl,offers:[{label,priceEur}]}, schedule. Foto promotion: storage gids-listing-photos/{listing_id}/promotion-0.*';

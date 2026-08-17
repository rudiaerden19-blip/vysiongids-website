-- Demo-zaken (PIN demo: 000000 — alleen voor test). Overige demo's staan in 010_remove_demo_listings_four.sql.

insert into public.gids_listings (
  slug, name, name_normalized, pin_hash, type, city, postcode, province, address, order_url,
  website, phone, email, opening_hours, closed_days, hours_by_day, amenities,
  rating_avg, rating_count, delivery_time_min, delivery_time_max, delivery_fee_eur, min_order_eur,
  pickup_enabled, delivery_enabled, lat, lng, status
) values (
  'eethuis-blonkys-dordrecht', 'Eethuis Blonkys', 'eethuis blonkys', 'scrypt:demo000000000001:83c98ce453d178123c3b351d1b48b7f4b16e3c3c96f2bb047fc4ef72f7672533', 'snack',
  'Dordrecht', '3311', null, 'Voorstraat 88', 'https://blonkys.ordervysion.com',
  'https://blonkys.ordervysion.com', '+31 78 123 45 67', 'info@blonkys.nl', 'Ma–Zo 11:00–23:00', null,
  '[{"day":"maandag","hours":"11:00-23:00"},{"day":"dinsdag","hours":"11:00-23:00"},{"day":"woensdag","hours":"11:00-23:00"},{"day":"donderdag","hours":"11:00-23:00"},{"day":"vrijdag","hours":"11:00-23:00"},{"day":"zaterdag","hours":"11:00-23:00"},{"day":"zondag","hours":"11:00-23:00"}]'::jsonb, '["bancontact","wifi","takeaway","delivery"]'::jsonb,
  0, 0, 20, 40, null, 20,
  true, true, 51.813, 4.669, 'published'
) on conflict (slug) do nothing;

insert into public.gids_listing_photos (listing_id, sort_order, storage_path, public_url)
select id, 0, 'eethuis-blonkys-dordrecht/0.jpg', '/images/listings/snack.jpg' from public.gids_listings where slug = 'eethuis-blonkys-dordrecht'
on conflict (listing_id, sort_order) do nothing;

insert into public.gids_listings (
  slug, name, name_normalized, pin_hash, type, city, postcode, province, address, order_url,
  website, phone, email, opening_hours, closed_days, hours_by_day, amenities,
  rating_avg, rating_count, delivery_time_min, delivery_time_max, delivery_fee_eur, min_order_eur,
  pickup_enabled, delivery_enabled, lat, lng, status
) values (
  'bar-lies-opglabeek', 'Bar Lies', 'bar lies', 'scrypt:demo000000000001:83c98ce453d178123c3b351d1b48b7f4b16e3c3c96f2bb047fc4ef72f7672533', 'restaurant',
  'Opglabeek', '3660', 'limburg', 'Torenstraat 12', 'https://barlies.ordervysion.com',
  'https://barlies.ordervysion.com', '+32 11 60 12 00', 'eat@barlies.be', 'Wo–Zo 12:00–22:00', null,
  '[{"day":"maandag","hours":"gesloten"},{"day":"dinsdag","hours":"gesloten"},{"day":"woensdag","hours":"12:00-22:00"},{"day":"donderdag","hours":"17:30-23:00"},{"day":"vrijdag","hours":"17:30-00:00"},{"day":"zaterdag","hours":"12:00-15:00, 17:30-00:00"},{"day":"zondag","hours":"12:00-15:00, 17:30-23:00"}]'::jsonb, '["bancontact","wifi","chef","terrace","wheelchair"]'::jsonb,
  0, 0, 30, 50, 3, 25,
  true, true, 51.041, 5.593, 'published'
) on conflict (slug) do nothing;

insert into public.gids_listing_photos (listing_id, sort_order, storage_path, public_url)
select id, 0, 'bar-lies-opglabeek/0.jpg', '/images/listings/restaurant.jpg' from public.gids_listings where slug = 'bar-lies-opglabeek'
on conflict (listing_id, sort_order) do nothing;

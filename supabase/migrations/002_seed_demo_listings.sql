-- Demo-zaken uit listings.json (PIN demo: 000000 — alleen voor test/demo)

insert into public.gids_listings (
  id, slug, name, name_normalized, pin_hash, type, city, postcode, province, address, order_url,
  website, phone, email, opening_hours, closed_days, hours_by_day, amenities,
  rating_avg, rating_count, delivery_time_min, delivery_time_max, delivery_fee_eur, min_order_eur,
  pickup_enabled, delivery_enabled, lat, lng, status
) values (
  '00000000-0000-4000-8000-f00000000000'::uuid, 'frituur-nolim-pelt', 'Frituur Nolim', 'frituur nolim', 'scrypt:demo000000000001:83c98ce453d178123c3b351d1b48b7f4b16e3c3c96f2bb047fc4ef72f7672533', 'frituur',
  'Pelt', '3900', 'limburg', 'Siberiëstraat 24', 'https://frituurnolim.ordervysion.com',
  'https://frituurnolim.ordervysion.com', '+32 11 64 12 34', 'info@frituurnolim.be', 'Di–Zo 11:30–22:00', 'Maandag',
  '[{"day":"maandag","hours":"gesloten"},{"day":"dinsdag","hours":"11:30-22:00"},{"day":"woensdag","hours":"11:30-22:00"},{"day":"donderdag","hours":"11:30-22:00"},{"day":"vrijdag","hours":"11:30-22:00"},{"day":"zaterdag","hours":"11:30-22:00"},{"day":"zondag","hours":"11:30-22:00"}]'::jsonb, '["bancontact","wifi","takeaway","delivery"]'::jsonb,
  4.7, 128, 25, 45, 2.5, 15,
  true, true, 51.2261485, 5.3776718, 'published'
) on conflict (slug) do nothing;

insert into public.gids_listing_photos (listing_id, sort_order, storage_path, public_url)
select id, 0, 'frituur-nolim-pelt/0.jpg', '/images/listings/frituur-1.jpg' from public.gids_listings where slug = 'frituur-nolim-pelt'
on conflict (listing_id, sort_order) do nothing;

insert into public.gids_listings (
  id, slug, name, name_normalized, pin_hash, type, city, postcode, province, address, order_url,
  website, phone, email, opening_hours, closed_days, hours_by_day, amenities,
  rating_avg, rating_count, delivery_time_min, delivery_time_max, delivery_fee_eur, min_order_eur,
  pickup_enabled, delivery_enabled, lat, lng, status
) values (
  '00000000-0000-4000-8000-ee000000b000'::uuid, 'eethuis-blonkys-dordrecht', 'Eethuis Blonkys', 'eethuis blonkys', 'scrypt:demo000000000001:83c98ce453d178123c3b351d1b48b7f4b16e3c3c96f2bb047fc4ef72f7672533', 'snack',
  'Dordrecht', '3311', null, 'Voorstraat 88', 'https://blonkys.ordervysion.com',
  'https://blonkys.ordervysion.com', '+31 78 123 45 67', 'info@blonkys.nl', 'Ma–Zo 11:00–23:00', null,
  '[{"day":"maandag","hours":"11:00-23:00"},{"day":"dinsdag","hours":"11:00-23:00"},{"day":"woensdag","hours":"11:00-23:00"},{"day":"donderdag","hours":"11:00-23:00"},{"day":"vrijdag","hours":"11:00-23:00"},{"day":"zaterdag","hours":"11:00-23:00"},{"day":"zondag","hours":"11:00-23:00"}]'::jsonb, '["bancontact","wifi","takeaway","delivery"]'::jsonb,
  4.8, 64, 20, 40, null, 20,
  true, true, 51.813, 4.669, 'published'
) on conflict (slug) do nothing;

insert into public.gids_listing_photos (listing_id, sort_order, storage_path, public_url)
select id, 0, 'eethuis-blonkys-dordrecht/0.jpg', '/images/listings/snack.jpg' from public.gids_listings where slug = 'eethuis-blonkys-dordrecht'
on conflict (listing_id, sort_order) do nothing;

insert into public.gids_listings (
  id, slug, name, name_normalized, pin_hash, type, city, postcode, province, address, order_url,
  website, phone, email, opening_hours, closed_days, hours_by_day, amenities,
  rating_avg, rating_count, delivery_time_min, delivery_time_max, delivery_fee_eur, min_order_eur,
  pickup_enabled, delivery_enabled, lat, lng, status
) values (
  '00000000-0000-4000-8000-ba0000e00000'::uuid, 'bar-lies-opglabeek', 'Bar Lies', 'bar lies', 'scrypt:demo000000000001:83c98ce453d178123c3b351d1b48b7f4b16e3c3c96f2bb047fc4ef72f7672533', 'restaurant',
  'Opglabeek', '3660', 'limburg', 'Torenstraat 12', 'https://barlies.ordervysion.com',
  'https://barlies.ordervysion.com', '+32 11 60 12 00', 'eat@barlies.be', 'Wo–Zo 12:00–22:00', null,
  '[{"day":"maandag","hours":"gesloten"},{"day":"dinsdag","hours":"gesloten"},{"day":"woensdag","hours":"12:00-22:00"},{"day":"donderdag","hours":"17:30-23:00"},{"day":"vrijdag","hours":"17:30-00:00"},{"day":"zaterdag","hours":"12:00-15:00, 17:30-00:00"},{"day":"zondag","hours":"12:00-15:00, 17:30-23:00"}]'::jsonb, '["bancontact","wifi","chef","terrace","wheelchair"]'::jsonb,
  4.6, 41, 30, 50, 3, 25,
  true, true, 51.041, 5.593, 'published'
) on conflict (slug) do nothing;

insert into public.gids_listing_photos (listing_id, sort_order, storage_path, public_url)
select id, 0, 'bar-lies-opglabeek/0.jpg', '/images/listings/restaurant.jpg' from public.gids_listings where slug = 'bar-lies-opglabeek'
on conflict (listing_id, sort_order) do nothing;

insert into public.gids_listings (
  id, slug, name, name_normalized, pin_hash, type, city, postcode, province, address, order_url,
  website, phone, email, opening_hours, closed_days, hours_by_day, amenities,
  rating_avg, rating_count, delivery_time_min, delivery_time_max, delivery_fee_eur, min_order_eur,
  pickup_enabled, delivery_enabled, lat, lng, status
) values (
  '00000000-0000-4000-8000-de0000ebab00'::uuid, 'demo-kebab-genk', 'Kebab House Genk', 'kebab house genk', 'scrypt:demo000000000001:83c98ce453d178123c3b351d1b48b7f4b16e3c3c96f2bb047fc4ef72f7672533', 'kebab',
  'Genk', '3600', 'limburg', 'Stationsstraat 12', 'https://www.vysionorder.com',
  'https://www.vysionorder.com', '+32 89 12 34 56', 'genk@vysiongids.be', 'Ma–Zo 11:00–23:00', null,
  '[{"day":"maandag","hours":"11:00-23:00"},{"day":"dinsdag","hours":"11:00-23:00"},{"day":"woensdag","hours":"11:00-23:00"},{"day":"donderdag","hours":"11:00-23:00"},{"day":"vrijdag","hours":"11:00-00:00"},{"day":"zaterdag","hours":"11:00-00:00"},{"day":"zondag","hours":"11:00-23:00"}]'::jsonb, '["bancontact","takeaway","delivery"]'::jsonb,
  4.4, 89, 15, 35, 2, 12,
  true, true, 50.9678, 5.4978, 'published'
) on conflict (slug) do nothing;

insert into public.gids_listing_photos (listing_id, sort_order, storage_path, public_url)
select id, 0, 'demo-kebab-genk/0.jpg', '/images/listings/kebab.jpg' from public.gids_listings where slug = 'demo-kebab-genk'
on conflict (listing_id, sort_order) do nothing;

insert into public.gids_listings (
  id, slug, name, name_normalized, pin_hash, type, city, postcode, province, address, order_url,
  website, phone, email, opening_hours, closed_days, hours_by_day, amenities,
  rating_avg, rating_count, delivery_time_min, delivery_time_max, delivery_fee_eur, min_order_eur,
  pickup_enabled, delivery_enabled, lat, lng, status
) values (
  '00000000-0000-4000-8000-de0000000a00'::uuid, 'demo-pizza-hasselt', 'Pizza Roma Hasselt', 'pizza roma hasselt', 'scrypt:demo000000000001:83c98ce453d178123c3b351d1b48b7f4b16e3c3c96f2bb047fc4ef72f7672533', 'pizza',
  'Hasselt', '3500', 'limburg', 'Demostraat 8', 'https://www.vysionorder.com',
  'https://www.vysionorder.com', '+32 11 22 33 44', 'hasselt@vysiongids.be', 'Di–Zo 16:00–22:30', null,
  '[{"day":"maandag","hours":"gesloten"},{"day":"dinsdag","hours":"16:00-22:30"},{"day":"woensdag","hours":"16:00-22:30"},{"day":"donderdag","hours":"16:00-22:30"},{"day":"vrijdag","hours":"16:00-23:00"},{"day":"zaterdag","hours":"16:00-23:00"},{"day":"zondag","hours":"16:00-22:30"}]'::jsonb, '["bancontact","wifi","delivery","takeaway"]'::jsonb,
  4.5, 210, 20, 45, null, 18,
  true, true, 50.931, 5.338, 'published'
) on conflict (slug) do nothing;

insert into public.gids_listing_photos (listing_id, sort_order, storage_path, public_url)
select id, 0, 'demo-pizza-hasselt/0.jpg', '/images/listings/pizza.jpg' from public.gids_listings where slug = 'demo-pizza-hasselt'
on conflict (listing_id, sort_order) do nothing;

insert into public.gids_listings (
  id, slug, name, name_normalized, pin_hash, type, city, postcode, province, address, order_url,
  website, phone, email, opening_hours, closed_days, hours_by_day, amenities,
  rating_avg, rating_count, delivery_time_min, delivery_time_max, delivery_fee_eur, min_order_eur,
  pickup_enabled, delivery_enabled, lat, lng, status
) values (
  '00000000-0000-4000-8000-de000f000000'::uuid, 'demo-frituur-neerpelt', 'Frituur De Markt', 'frituur de markt', 'scrypt:demo000000000001:83c98ce453d178123c3b351d1b48b7f4b16e3c3c96f2bb047fc4ef72f7672533', 'frituur',
  'Neerpelt', '3910', 'limburg', 'Markt 3', 'https://www.vysionorder.com',
  'https://www.vysionorder.com', '+32 11 66 55 44', null, 'Di–Zo 11:00–21:00', 'Dinsdag',
  '[{"day":"maandag","hours":"11:00-21:00"},{"day":"dinsdag","hours":"gesloten"},{"day":"woensdag","hours":"11:00-21:00"},{"day":"donderdag","hours":"11:00-21:00"},{"day":"vrijdag","hours":"11:00-21:00"},{"day":"zaterdag","hours":"11:00-21:00"},{"day":"zondag","hours":"11:00-21:00"}]'::jsonb, '["bancontact","takeaway","delivery"]'::jsonb,
  4.3, 56, 20, 35, 1.5, 10,
  true, true, 51.228, 5.442, 'published'
) on conflict (slug) do nothing;

insert into public.gids_listing_photos (listing_id, sort_order, storage_path, public_url)
select id, 0, 'demo-frituur-neerpelt/0.jpg', '/images/listings/frituur-2.jpg' from public.gids_listings where slug = 'demo-frituur-neerpelt'
on conflict (listing_id, sort_order) do nothing;

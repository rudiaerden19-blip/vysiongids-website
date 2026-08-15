-- Zaakfoto's: bucket public + leesbeleid (anon mag foto-URL's laden in browser).
-- Run in Supabase SQL Editor als je bucket al bestaat maar POLICIES = 0.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gids-listing-photos',
  'gids-listing-photos',
  true,
  52428800,
  null
)
on conflict (id) do update set public = true;

drop policy if exists "Public read gids listing photos" on storage.objects;

create policy "Public read gids listing photos"
  on storage.objects
  for select
  to public
  using (bucket_id = 'gids-listing-photos');

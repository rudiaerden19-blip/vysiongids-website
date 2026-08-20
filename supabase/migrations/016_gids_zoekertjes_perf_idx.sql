-- Snellere lijst: gepubliceerde zoekertjes gesorteerd op datum
create index if not exists gids_zoekertjes_published_created_idx
  on public.gids_zoekertjes (created_at desc)
  where status = 'published';

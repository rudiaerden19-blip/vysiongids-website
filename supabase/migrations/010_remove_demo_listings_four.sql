-- Verwijder oude demo-zaken (foto's/reviews/menu cascaden mee).
-- Overblijft in seed: Eethuis Blonkys, Bar Lies.

delete from public.gids_listings
where slug in (
  'frituur-nolim-pelt',
  'demo-kebab-genk',
  'demo-pizza-hasselt',
  'demo-frituur-neerpelt'
);

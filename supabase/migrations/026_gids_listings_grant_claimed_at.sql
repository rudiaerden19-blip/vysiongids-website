-- Anon/authenticated mogen claimed_at lezen (claim-knop / gids_listings SELECT in app).
-- pin_hash blijft verboden (017).

grant select (claimed_at) on public.gids_listings to anon, authenticated;

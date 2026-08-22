-- Na migratie 021: anon/authenticated mogen horeca_types lezen (kolom-permissies uit 017).
-- Zonder deze regel crasht/gefaalt de publieke SELECT zodra de app horeca_types opvraagt.

grant select (horeca_types) on public.gids_listings to anon, authenticated;

-- ⚠️ Alleen gebruiken om foutieve claimed_at van oude zaak-toevoegen-bug te wissen.
-- Gebruik daarna RESTORE_CLAIMED_AT_ACTIVATED.sql voor zaken die wél geclaimd zijn (Nolim, …).

update public.gids_listings
set claimed_at = null
where pin_hash is not null
  and claimed_at is not null;

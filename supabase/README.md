# Supabase — Vysiongids (los project)

Gebruik **een nieuw Supabase-project** alleen voor vysiongids.be.  
Geen keys, geen tabellen en geen storage van Vysion Order / kassa.

## Setup

1. [supabase.com](https://supabase.com) → **New project** (bijv. `vysiongids-prod`, regio EU).
2. SQL Editor → plak en run `migrations/001_gids_schema.sql`.
3. Storage → **New bucket** `gids-listing-photos` → **Public** (alleen published foto-URLs) of private + signed URLs later.
4. Project Settings → API → kopieer URL + anon + service_role naar `.env.local` en Vercel.

## Migraties

| Bestand | Inhoud |
|---------|--------|
| `migrations/001_gids_schema.sql` | Tabellen `gids_listings`, `gids_listing_photos` (voor zaak+pin-flow) |

Tot de app op Supabase leest, blijven demo-zaken in `data/listings.json` werken.

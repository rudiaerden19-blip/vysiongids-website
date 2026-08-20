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
| `migrations/017_gids_listings_hide_sensitive_columns.sql` | **Verplicht prod:** anon mag `pin_hash` / `name_normalized` niet lezen |

Nieuwe productie-DB’s: run migraties **001 → 017** in volgorde. Bestaande DB: run minstens **017** in SQL Editor.

Tot de app op Supabase leest, blijven demo-zaken in `data/listings.json` werken.

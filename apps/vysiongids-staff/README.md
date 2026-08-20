# Vysiongids medewerkersportaal

Aparte Next.js-app — **niet** onder www.vysiongids.be. Beheer premium, pauzeren en verwijderen van gids-zaken.

## Lokaal

```bash
cd apps/vysiongids-staff
cp .env.local.example .env.local
npm install
npm run dev
```

Open http://localhost:3010

## Vercel (tweede project)

1. Nieuw Vercel-project (zelfde GitHub-repo).
2. **Root Directory:** `apps/vysiongids-staff`
3. Env vars uit `.env.local.example` (zelfde Supabase als de gids).
4. Eigen domein, bv. `gids-beheer.webvysion.tech` (niet koppelen aan vysiongids.be).

## Publieke gids cache

Na wijzigingen roept dit portaal `POST https://www.vysiongids.be/api/gids/internal/revalidate` aan. Op het **gids**-Vercel-project moet **`VYSIONGIDS_STAFF_PASSWORD`** dezelfde waarde hebben als hier.

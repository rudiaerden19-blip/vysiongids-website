# Alle zaken — pins / satelliet opnieuw geocoden

Na wijzigingen aan geocoding (straat + huisnummer, geen zaaknaam):

## Lokaal (aanbevolen)

Met `.env.local` (service role):

```bash
npm run regeocode-listings
```

Optioneel testen op N zaken:

```bash
npx tsx scripts/regeocode-all-gids-listings.ts --limit=20
```

Pauze tussen requests: `GEOCODE_BATCH_DELAY_MS=1100` (default, Nominatim fair use).

## Staff API (chunks op productie)

Ingelogd als staff:

```http
POST /api/gids/staff/regeocode-batch
Content-Type: application/json

{ "page": 1, "limit": 8 }
```

Herhaal `page` tot `done: true`. Alleen `status = published`.

## Cache

Zaakpagina’s `revalidate = 60`; na batch even wachten of Vercel redeploy voor directe satelliet-update overal.

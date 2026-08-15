# Vysiongids

Gids om frituren, kebab, pizza en horeca te vinden — **Bestel** linkt door naar het platform van de zaak.

## Lokaal

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Pagina’s

| Route | Functie |
|-------|---------|
| `/` | Home + zoekformulier |
| `/zoeken?q=pelt&type=frituur` | Panelenlijst |
| `/zaak/[slug]` | Profiel + knop **Bestel** |

## 400+ zaken importeren

1. Kopieer `data/listings.template.csv` (scheidingsteken `;`).
2. Vul rijen in (of export uit Excel).
3. `node scripts/import-listings-csv.mjs pad/naar/jouw.csv`
4. Opnieuw `npm run build` (SSG voor alle slugs).

Data staat in `data/listings.json` (nu 6 demo-zaken).

## Deploy (apart van Vysion Order)

**Volledige stappen:** zie [`DEPLOY.md`](./DEPLOY.md) — nieuw **Supabase-project**, nieuw **Vercel-project**, repo **`vysiongids-website`**, domein **www.vysiongids.be**.

- Geen kassa/GKS/tenant-keys in dit project.
- Env: `.env.local.example` → `NEXT_PUBLIC_VYSIONGIDS_*` + `VYSIONGIDS_SUPABASE_SERVICE_ROLE_KEY`.

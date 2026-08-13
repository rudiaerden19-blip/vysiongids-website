# GitHub + Vercel (apart project)

## 1. GitHub (eenmalig)

```bash
cd /Users/rudiaerden/AndroidStudioProjects/vysiongids-website
gh auth login
gh repo create vysiongids-website --public --source=. --remote=origin --push --description "Vysiongids horeca gids"
```

Als `origin` al bestaat:

```bash
git push -u origin main
```

Repo-URL: `https://github.com/rudiaerden19-blip/vysiongids-website`

## 2. Vercel — **nieuw project** (niet vysionhoreca / vysionorder)

1. [vercel.com/new](https://vercel.com/new) → **Import Git Repository** → `vysiongids-website`.
2. Framework: **Next.js** (auto). Root: `.` — geen monorepo.
3. Deploy → noteer `*.vercel.app` preview-URL.

## 3. Domein vysiongids.be

Project → **Settings → Domains**:

- `vysiongids.be`
- `www.vysiongids.be`

DNS bij je registrar (of nameservers naar Vercel):

- **A** `@` → `76.76.21.21`
- **CNAME** `www` → `cname.vercel-dns.com`

(Waarden altijd verifiëren in het Vercel-domeinscherm.)

## 4. Na CSV-import (400 zaken)

```bash
node scripts/import-listings-csv.mjs data/jouw.csv
git add data/listings.json && git commit -m "Listings bijwerken" && git push
```

Vercel bouwt automatisch opnieuw.

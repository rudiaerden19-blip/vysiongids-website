# Vysiongids — GitHub, Vercel, Supabase (alles apart)

**Vysiongids heeft niets te maken met Vysion Order, kassa of GKS.**  
Drie aparte systemen:

| Systeem | Wat |
|---------|-----|
| **GitHub** | Repo `vysiongids-website` (deze map) |
| **Vercel** | Nieuw project, alleen deze repo |
| **Supabase** | Nieuw project, alleen `gids_*` tabellen |

---

## 1. GitHub

Repo: `https://github.com/rudiaerden19-blip/vysiongids-website`

```bash
cd vysiongids-website
git add -A
git commit -m "..."
git push origin main
```

---

## 2. Supabase (nieuw project)

1. Dashboard → **New project** (naam bv. `vysiongids`, regio **Frankfurt** of dicht bij BE).
2. **SQL Editor** → run `supabase/migrations/001_gids_schema.sql`.
3. **Storage** → bucket `gids-listing-photos` (public read voor foto-URLs, of later signed).
4. **Settings → API**:
   - Project URL → `NEXT_PUBLIC_VYSIONGIDS_SUPABASE_URL`
   - anon public → `NEXT_PUBLIC_VYSIONGIDS_SUPABASE_ANON_KEY`
   - service_role → `VYSIONGIDS_SUPABASE_SERVICE_ROLE_KEY` (alleen server / Vercel, nooit client)

Gebruik **geen** URL/keys van het Order/kassa-project.

---

## 3. Vercel (nieuw project)

1. [vercel.com](https://vercel.com) → **Add New → Project**.
2. Import **GitHub** → `rudiaerden19-blip/vysiongids-website`.
3. Framework: **Next.js**, root: **`.`** (repo root), branch **main** = Production.
4. **Environment Variables** (Production + Preview):

   | Name | Waarde |
   |------|--------|
   | `NEXT_PUBLIC_VYSIONGIDS_SUPABASE_URL` | Supabase project URL |
   | `NEXT_PUBLIC_VYSIONGIDS_SUPABASE_ANON_KEY` | anon key |
   | `VYSIONGIDS_SUPABASE_SERVICE_ROLE_KEY` | service role (geheim) |
   | `VYSIONGIDS_SESSION_SECRET` | `openssl rand -base64 32` |

5. Deploy. Controleer dat deployment type **Production** is op `main`.

---

## 4. Domein www.vysiongids.be

1. Vercel project → **Settings → Domains**.
2. Voeg toe: `www.vysiongids.be` en `vysiongids.be`.
3. Bij je DNS-provider (registrar):

   - **www** → CNAME naar `cname.vercel-dns.com` (of wat Vercel toont).
   - **apex** `@` → A-records of ALIAS zoals Vercel aangeeft.

4. Wacht op SSL (automatisch). Zet **www** als primary redirect indien gewenst.

---

## 5. Lokaal

```bash
cp .env.local.example .env.local
# vul Supabase + SESSION_SECRET in
npm install
npm run dev
```

---

## Checklist

- [ ] Supabase-project **alleen** voor gids
- [ ] Migratie `001_gids_schema.sql` gedraaid
- [ ] Vercel-project **alleen** gekoppeld aan `vysiongids-website`
- [ ] Geen Order/kassa env vars in Vercel gids-project
- [ ] `main` → Production deployment groen
- [ ] `https://www.vysiongids.be` werkt

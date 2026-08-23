# Vysiongids — testrapport & checklists

**Repo:** `vysiongids-website`  
**Productie:** push naar **`main`** → Vercel **Production** (alle tenants / één deploy)

---

## Lidmaatschap & betaling — checklist (horeca vs diensten)

Prijzen in code: **gratis zaakkaart (horeca)** · **premium horeca €49/jaar** (zoekertjes + vacatures) · **diensten €99/jaar**.

### Vercel / Stripe (vóór elke betalingstest)

- [ ] `STRIPE_SECRET_KEY` en webhooks gezet (`STRIPE_GIDS_PREMIUM_WEBHOOK_SECRET`, diensten-webhook indien apart)
- [ ] Premium: **`STRIPE_GIDS_PREMIUM_AMOUNT_CENTS=4900`** of env weg (default = €49). **Niet** `5000` laten staan.
- [ ] Diensten: default **9900** cent (€99) via `GIDS_DIENSTEN_YEARLY_EUR` / `STRIPE_GIDS_DIENSTEN_AMOUNT_CENTS`

### 1. Gratis horeca-kaart (`/zaak-toevoegen`)

- [ ] Registratie lukt zonder Stripe; zaak staat op `/zaak/{slug}` en in `/zoeken`
- [ ] Inloggen → **Beheer**: gegevens, foto’s, menu bewerken **zonder** premium
- [ ] **Vacature plaatsen** / zoekertje: paywall of fout tot premium betaald is
- [ ] PATCH vacature met hiring aan zonder premium → API **403** met €49/jaar

### 2. Premium horeca €49 (`/beheer` → Premium nemen)

- [ ] Stripe Checkout toont **€49** (Bancontact/kaart)
- [ ] Na betaling: redirect `?premium=success`; binnen ~30s `premium_member` actief (webhook)
- [ ] Knop «Premium — €49/jaar» verdwijnt; **Zoekertje plaatsen** en vacature-sectie bruikbaar
- [ ] Zoekertje verschijnt op `/zoekertjes`; actieve vacature op `/jobs` (premium + hiring)
- [ ] **Geen** zoekertjes via horeca-premium voor `listing_segment = diensten` (API 403)

### 3. Diensten €99 (`/diensten/aanmelden`)

- [ ] Registratie → Stripe **€99** (tenzij `GIDS_DIENSTEN_SKIP_PAYMENT` alleen lokaal)
- [ ] Na betaling: profiel op `/diensten/{slug}` zichtbaar in diensten-zoeken
- [ ] Beheer toont **BeheerDienstenPanel** (€99/jaar), **geen** horeca-zoekertjes-sectie
- [ ] Horeca premium-checkout **niet** vereist voor diensten-profiel

### Copy (sanity)

- [ ] Intro «Lees eerst dit»: gratis **zaakkaart**; premium apart €49; diensten €99
- [ ] Paywall modal: alleen vacatures/zoekertjes premium, niet «hele gids gratis premium»

---

## Snelle commands

```bash
npx tsc --noEmit
npm test
```

**Datum laatste billing-flow review:** 23 augustus 2026 (commit `dac9aa1` op `main`).

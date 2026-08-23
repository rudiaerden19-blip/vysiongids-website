# Vysiongids — testrapport

**Repo:** `vysiongids-website`  
**Productie:** push naar **`main`** → Vercel **Production**

---

## Lidmaatschap & betaling (gratis kaart · €49 premium · €99 diensten)

### Door Cursor/agent uitgevoerd (code + static check)

| Onderdeel | Status | Bewijs |
|-----------|--------|--------|
| Horeca registratie zonder Stripe | ✅ in code | `POST /api/gids/register` — geen checkout |
| Premium alleen voor zoekertjes/vacatures | ✅ in code | `gids-zoekertjes-eligibility`, `zoekertjes/route`, `me` PATCH hiring |
| Stripe premium default **€49** | ✅ in code | `GIDS_PREMIUM_YEARLY_EUR = 49`, `gidsPremiumUnitAmountCents()` |
| Diensten **€99** bij aanmelden | ✅ in code | `GIDS_DIENSTEN_YEARLY_EUR`, `register-diensten` + checkout |
| Webhook activeert premium/diensten | ✅ in code | `premium/webhook/route.ts` |
| Copy intro + paywall aligned | ✅ | `ZaakToevoegenIntroGate`, `GidsPremiumPaywallModal`, commits `dac9aa1` … |
| TypeScript | ✅ | `npx tsc --noEmit` groen na wijzigingen |

**Niet door agent uitgevoerd:** echte Stripe-betaling, Vercel-env, browser op productie-URL (geen toegang tot jullie secrets/accounts). Dat blijft **jouw** bevestiging in live omgeving.

### Live bevestigd (eigenaar, productie)

| Pad | Status | Opmerking |
|-----|--------|-----------|
| Premium horeca **€49** (Stripe Checkout) | ✅ | o.a. «Vysiongids Premium (1 jaar) — Vacatures & zoekertjes» |
| Diensten **€99** | ✅ | checkout werkt |

### Nog optioneel op productie (Stripe/Vercel)

Alleen als je extra wilt dubbelchecken:

1. **Env Vercel:** `STRIPE_GIDS_PREMIUM_AMOUNT_CENTS` = **4900** of unset (niet 5000) — checkout toont al €49.
2. **Gratis kaart:** test-zaak registreren → publieke pagina + beheer zonder premium; zoekertje/vacature geblokkeerd tot premium actief is na betaling.

---

## Snelle commands (lokaal / CI)

```bash
npx tsc --noEmit
npm test
```

**Laatste agent-review billing-flow:** 23 augustus 2026 — commits `dac9aa1`, `5d2de47` op `main`.

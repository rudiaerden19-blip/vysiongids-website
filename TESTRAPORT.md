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

### Nog door eigenaar op productie (Stripe/Vercel)

Alleen als je live wilt bevestigen — niet omdat de agent het al “getest” heeft:

1. **Env Vercel:** `STRIPE_GIDS_PREMIUM_AMOUNT_CENTS` = **4900** of unset (niet 5000).
2. **Gratis kaart:** test-zaak registreren → publieke pagina + beheer zonder premium; zoekertje/vacature geblokkeerd.
3. **€49:** Premium nemen in beheer → checkoutbedrag €49 → webhook → zoekertje/vacature werkt.
4. **€99:** `/diensten/aanmelden` → checkout €99 → profiel zichtbaar.

---

## Snelle commands (lokaal / CI)

```bash
npx tsc --noEmit
npm test
```

**Laatste agent-review billing-flow:** 23 augustus 2026 — commits `dac9aa1`, `5d2de47` op `main`.

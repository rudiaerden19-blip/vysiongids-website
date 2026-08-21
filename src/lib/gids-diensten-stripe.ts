import { GIDS_DIENSTEN_YEARLY_EUR } from '@/lib/gids-diensten-pricing'
import { siteOriginFromRequest } from '@/lib/gids-site-origin'

export { siteOriginFromRequest }

export function gidsDienstenStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim())
}

/** Eigenaar/test: geen Stripe-checkout; profiel direct zichtbaar (niet op production laten staan). */
export function gidsDienstenSkipPayment(): boolean {
  const v = process.env.GIDS_DIENSTEN_SKIP_PAYMENT?.trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'yes'
}

export function gidsDienstenRequiresCheckout(): boolean {
  return gidsDienstenStripeConfigured() && !gidsDienstenSkipPayment()
}

export function gidsDienstenUnitAmountCents(): number {
  const fromEnv = process.env.STRIPE_GIDS_DIENSTEN_AMOUNT_CENTS?.trim()
  if (fromEnv && /^\d+$/.test(fromEnv)) return Number(fromEnv)
  return GIDS_DIENSTEN_YEARLY_EUR * 100
}

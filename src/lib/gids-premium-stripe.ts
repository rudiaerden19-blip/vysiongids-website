import { GIDS_PREMIUM_YEARLY_EUR } from '@/lib/gids-premium'

export function gidsPremiumStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim())
}

import { siteOriginFromRequest } from '@/lib/gids-site-origin'

export { siteOriginFromRequest }

export function gidsPremiumUnitAmountCents(): number {
  const fromEnv = process.env.STRIPE_GIDS_PREMIUM_AMOUNT_CENTS?.trim()
  if (fromEnv && /^\d+$/.test(fromEnv)) return Number(fromEnv)
  return GIDS_PREMIUM_YEARLY_EUR * 100
}

export type GidsPremiumCheckoutMetadata = {
  listing_id: string
  listing_slug: string
  contact_name: string
  zaak_name: string
  contact_phone: string
  contact_email: string
}

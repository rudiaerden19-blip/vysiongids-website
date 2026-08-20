import { GIDS_PREMIUM_YEARLY_EUR } from '@/lib/gids-premium'

export function gidsPremiumStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim())
}

export function siteOriginFromRequest(req: Request): string {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  const proto = req.headers.get('x-forwarded-proto') ?? 'https'
  if (host) return `${proto}://${host}`
  return process.env.NEXT_PUBLIC_VYSIONGIDS_SITE_URL?.replace(/\/$/, '') ?? 'https://www.vysiongids.be'
}

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

/** Vysiongids premium — vacatures & zoekertjes (en andere voordelen). */
export const GIDS_PREMIUM_YEARLY_EUR = 50
export const GIDS_PREMIUM_TERM_DAYS = 365

export const GIDS_PREMIUM_CONTACT_EMAIL = 'contact@webvysion.tech'

export type GidsPremiumRowFields = {
  premium_member?: boolean | null
  premium_paused?: boolean | null
  premium_expires_at?: string | null
}

export function resolveListingPremiumActive(fields: GidsPremiumRowFields | null | undefined): boolean {
  if (!fields || fields.premium_member !== true) return false
  if (fields.premium_paused === true) return false
  const expRaw = fields.premium_expires_at
  if (expRaw) {
    const t = Date.parse(expRaw)
    if (!Number.isNaN(t) && t < Date.now()) return false
  }
  return true
}

/** @deprecated gebruik resolveListingPremiumActive voor rijen; boolean blijft voor eenvoudige callers */
export function listingHasGidsPremium(premiumMember: boolean | GidsPremiumRowFields | null | undefined): boolean {
  if (typeof premiumMember === 'boolean' || premiumMember == null) {
    return premiumMember === true
  }
  return resolveListingPremiumActive(premiumMember)
}

export function addPremiumTermDays(from: Date, days = GIDS_PREMIUM_TERM_DAYS): Date {
  const d = new Date(from.getTime())
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

export function gidsPremiumSubscribeMailtoHref(listingName?: string): string {
  const subject = encodeURIComponent('Vysiongids Premium lidmaatschap (€50/jaar)')
  const body = encodeURIComponent(
    listingName
      ? `Ik wil betalend lid worden van Vysiongids voor ${listingName}.\n\nGraag info over betaling en activatie.`
      : 'Ik wil betalend lid worden van Vysiongids (€50/jaar).\n\nGraag info over betaling en activatie.',
  )
  return `mailto:${GIDS_PREMIUM_CONTACT_EMAIL}?subject=${subject}&body=${body}`
}

export function formatGidsPremiumDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('nl-BE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

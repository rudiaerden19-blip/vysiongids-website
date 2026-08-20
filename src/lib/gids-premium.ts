/** Vysiongids premium — vacatures & zoekertjes (en andere voordelen). */
export const GIDS_PREMIUM_YEARLY_EUR = 50

export const GIDS_PREMIUM_CONTACT_EMAIL = 'contact@webvysion.tech'

export function listingHasGidsPremium(premiumMember: boolean | null | undefined): boolean {
  return premiumMember === true
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

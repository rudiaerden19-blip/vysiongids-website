import { normalizeGidsBusinessName } from '@/lib/gids-text'
import { isGidsOwnerPin } from '@/lib/gids-pin'

/** Geen Stripe voor eigenaar/test (naam, e-mail Vysion, of eigenaar-PIN). */
export function isDienstenComplimentaryRegistration(input: {
  name: string
  email?: string | null
  pin?: string | null
}): boolean {
  if (input.pin && isGidsOwnerPin(input.pin)) return true
  const n = normalizeGidsBusinessName(input.name)
  if (n.includes('vysion')) return true
  const e = (input.email ?? '').trim().toLowerCase()
  if (!e) return false
  if (e === 'info@vysionhoreca.com') return true
  if (e.endsWith('@vysionhoreca.com')) return true
  return false
}

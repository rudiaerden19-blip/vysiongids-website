import { normalizeGidsBusinessName } from '@/lib/gids-text'

/** Geen Stripe voor eigenaar/test (naam of e-mail Vysion). */
export function isDienstenComplimentaryRegistration(input: {
  name: string
  email?: string | null
}): boolean {
  const n = normalizeGidsBusinessName(input.name)
  if (n.includes('vysion')) return true
  const e = (input.email ?? '').trim().toLowerCase()
  if (!e) return false
  if (e === 'info@vysionhoreca.com') return true
  if (e.endsWith('@vysionhoreca.com')) return true
  return false
}

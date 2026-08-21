/** Normaliseer naar E.164-cijfers voor België (32 + nationaal nummer, zonder +). */
export function belgiumPhoneE164Digits(raw: string): string | null {
  const cleaned = raw.trim().replace(/[\s().-]/g, '')
  if (!cleaned) return null

  let digits = cleaned
  if (digits.startsWith('+')) digits = digits.slice(1)
  if (digits.startsWith('00')) digits = digits.slice(2)

  if (digits.startsWith('32')) {
    const rest = digits.slice(2)
    const national = rest.startsWith('0') ? rest.slice(1) : rest
    if (/^\d{8,9}$/.test(national)) return `32${national}`
  }

  if (digits.startsWith('0') && /^\d{9,10}$/.test(digits)) {
    return `32${digits.slice(1)}`
  }

  if (/^[1-9]\d{7,8}$/.test(digits)) {
    return `32${digits}`
  }

  return null
}

/** Publieke weergave: altijd met +32 voor Belgische nummers. */
export function formatBelgiumPhoneDisplay(raw: string | undefined | null): string | null {
  const trimmed = raw?.trim()
  if (!trimmed) return null

  const e164 = belgiumPhoneE164Digits(trimmed)
  if (!e164) return trimmed

  const national = e164.slice(2)
  if (national.length === 9) {
    return `+32 ${national.slice(0, 3)} ${national.slice(3, 5)} ${national.slice(5, 7)} ${national.slice(7, 9)}`
  }
  if (national.length === 8) {
    return `+32 ${national.slice(0, 2)} ${national.slice(2, 5)} ${national.slice(5, 8)}`
  }
  return `+32 ${national}`
}

export function belgiumPhoneTelHref(raw: string | undefined | null): string | null {
  const trimmed = raw?.trim()
  if (!trimmed) return null

  const e164 = belgiumPhoneE164Digits(trimmed)
  if (e164) return `tel:+${e164}`

  const fallback = trimmed.replace(/[^\d+]/g, '')
  if (!fallback) return null
  return fallback.startsWith('+') ? `tel:${fallback}` : `tel:+${fallback}`
}

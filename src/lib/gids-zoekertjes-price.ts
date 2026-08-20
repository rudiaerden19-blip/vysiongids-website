/** Normaliseer ingevoerde prijs naar weergave (nl-BE, euro). */
export function normalizeGidsZoekertjePriceInput(raw: string): string | null {
  const t = raw.trim()
  if (!t) return null
  const cleaned = t.replace(/\s/g, '').replace(/^€/, '').replace(',', '.')
  const num = Number.parseFloat(cleaned)
  if (Number.isNaN(num) || num < 0) return null
  return new Intl.NumberFormat('nl-BE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(num)
}

export function gidsZoekertjePriceForInput(stored: string): string {
  const t = stored.trim()
  if (!t || t === 'Bieden') return ''
  return t.replace(/^€\s?/u, '').trim()
}

export function formatGidsZoekertjePriceDisplay(stored: string): string {
  const t = stored.trim()
  if (!t) return '—'
  if (t === 'Bieden') return '—'
  if (t.toLowerCase() === 'gratis') return 'Gratis'
  return t
}

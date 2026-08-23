import { formatGidsTitleCase } from '@/lib/gids-text'

export type ListingPromotionOfferRow = {
  label: string
  priceEur?: number | null
}

export const MAX_PROMOTION_OFFER_ROWS = 3

export function parsePromotionPriceEur(raw: string): number | null {
  const t = String(raw ?? '').trim().replace(',', '.')
  if (!t) return null
  const n = Number(t)
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null
}

export function formatPromotionPriceDisplay(priceEur: number | null | undefined): string {
  if (priceEur == null || !Number.isFinite(priceEur)) return ''
  return `€${priceEur.toFixed(2).replace('.', ',')}`
}

export function normalizePromotionOfferRows(raw: unknown): ListingPromotionOfferRow[] {
  if (!Array.isArray(raw)) return []
  const out: ListingPromotionOfferRow[] = []
  for (const item of raw.slice(0, MAX_PROMOTION_OFFER_ROWS)) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const label = formatGidsTitleCase(String(row.label ?? '').trim()).slice(0, 80)
    const priceRaw = row.priceEur
    const priceEur =
      priceRaw == null || priceRaw === ''
        ? null
        : Number(typeof priceRaw === 'string' ? String(priceRaw).replace(',', '.') : priceRaw)
    const priceOk = Number.isFinite(priceEur) && priceEur! >= 0 ? priceEur : null
    if (!label && priceOk == null) continue
    out.push({ label, ...(priceOk != null ? { priceEur: priceOk } : {}) })
  }
  return out
}

export function parsePromotionOfferRowsFromForm(form: FormData): ListingPromotionOfferRow[] {
  const rows: ListingPromotionOfferRow[] = []
  for (let i = 0; i < MAX_PROMOTION_OFFER_ROWS; i++) {
    const label = formatGidsTitleCase(String(form.get(`infoPromotionOfferLabel${i}`) ?? '').trim()).slice(0, 80)
    const priceEur = parsePromotionPriceEur(String(form.get(`infoPromotionOfferPrice${i}`) ?? ''))
    if (!label && priceEur == null) continue
    rows.push({ label, ...(priceEur != null ? { priceEur } : {}) })
  }
  return rows
}

export function promotionOfferRowsHaveContent(rows: ListingPromotionOfferRow[] | undefined): boolean {
  return Boolean(rows?.some((r) => r.label.trim() || r.priceEur != null))
}

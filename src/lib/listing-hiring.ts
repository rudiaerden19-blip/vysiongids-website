import { formatGidsTitleCase } from '@/lib/gids-text'

export const HIRING_JOB_TYPES = [
  { id: 'fulltime', label: 'Fulltime' },
  { id: 'parttime', label: 'Parttime' },
  { id: 'flexijob', label: 'Flexijob' },
  { id: 'student', label: 'Student' },
  { id: 'gepensioneerde', label: 'Gepensioneerde' },
  { id: 'seizoen', label: 'Seizoen' },
  { id: 'stage', label: 'Stage' },
  { id: 'other', label: 'Andere' },
] as const

export type HiringJobTypeId = (typeof HIRING_JOB_TYPES)[number]['id']

const JOB_TYPE_IDS = new Set<string>(HIRING_JOB_TYPES.map((t) => t.id))

export function normalizeHiringJobTypes(raw: unknown): HiringJobTypeId[] {
  if (!Array.isArray(raw)) return []
  const out: HiringJobTypeId[] = []
  for (const item of raw) {
    const id = String(item ?? '').trim()
    if (!JOB_TYPE_IDS.has(id)) continue
    if (out.includes(id as HiringJobTypeId)) continue
    out.push(id as HiringJobTypeId)
  }
  return out
}

export function hiringJobTypeLabels(ids: HiringJobTypeId[] | undefined): string[] {
  if (!ids?.length) return []
  return ids
    .map((id) => HIRING_JOB_TYPES.find((t) => t.id === id)?.label ?? id)
    .filter(Boolean)
}

export type ListingHiringFields = {
  enabled?: boolean
  /** Korte titel op Jobs-pagina, bv. «Flexi gevraagd» */
  title?: string
  text?: string
  phone?: string
  email?: string
  /** Werkuren voor vacature (vrij tekst, zichtbaar in popup). */
  hours?: string
  jobTypes?: HiringJobTypeId[]
  /** ISO-datum eerste publicatie vacature (Jobs). */
  postedAt?: string
}

export function listingHiringIsActive(h: ListingHiringFields | undefined | null): boolean {
  if (!h?.enabled) return false
  const title = h.title?.trim() ?? ''
  const text = h.text?.trim() ?? ''
  const phone = h.phone?.trim() ?? ''
  const email = h.email?.trim() ?? ''
  const jobTypes = h.jobTypes?.length ?? 0
  return Boolean(title || text || phone || email || jobTypes)
}

/** Titel op Jobs-kaart; fallback voor oudere vacatures zonder titelveld. */
export function listingHiringDisplayTitle(h: ListingHiringFields): string {
  const title = h.title?.trim()
  if (title) return title
  const labels = hiringJobTypeLabels(h.jobTypes)
  if (labels.length) return `${labels.join(' · ')} gezocht`
  const text = h.text?.trim() ?? ''
  if (text) {
    const firstLine = text.split(/\r?\n/)[0]?.trim() ?? text
    if (firstLine.length <= 72) return firstLine
    return `${firstLine.slice(0, 69)}…`
  }
  return 'Vacature'
}

/** Korte titel op zoekkaart (blauwe balk) — geen lange omschrijving. */
export function listingHiringBarTitle(h: ListingHiringFields): string {
  const title = h.title?.trim()
  if (title) return formatGidsTitleCase(title)
  const labels = hiringJobTypeLabels(h.jobTypes)
  if (labels.length) return `${labels.join(' · ')} gezocht`
  return 'Personeel gezocht'
}

export function formatListingHiringPanelMessage(h: ListingHiringFields): string {
  return listingHiringBarTitle(h)
}

export const LISTING_PANEL_HIRING_EMPTY_MESSAGE = 'Deze zaak zoekt momenteel geen personeel.'

/** ISO-timestamp voor «Geplaatst op» — opgeslagen postedAt of fallback (bv. listing updated_at). */
export function resolveListingHiringPostedAt(
  hiring: ListingHiringFields | undefined,
  fallbackIso?: string,
): string | undefined {
  const raw = hiring?.postedAt?.trim() || fallbackIso?.trim()
  return raw || undefined
}

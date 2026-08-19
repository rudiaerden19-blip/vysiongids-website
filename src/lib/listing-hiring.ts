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
  text?: string
  phone?: string
  jobTypes?: HiringJobTypeId[]
}

export function listingHiringIsActive(h: ListingHiringFields | undefined | null): boolean {
  if (!h?.enabled) return false
  const text = h.text?.trim() ?? ''
  const phone = h.phone?.trim() ?? ''
  const jobTypes = h.jobTypes?.length ?? 0
  return Boolean(text || phone || jobTypes)
}

export function formatListingHiringPanelMessage(h: ListingHiringFields): string {
  const text = h.text?.trim() ?? ''
  let message = text
  if (message && !/^wij zoeken\b/i.test(message)) {
    message = `Wij zoeken ${message.charAt(0).toLowerCase()}${message.slice(1)}`
  } else if (!message) {
    message = 'Wij zoeken personeel'
  }
  const labels = hiringJobTypeLabels(h.jobTypes)
  if (labels.length) {
    message = `${message} (${labels.join(', ')})`
  }
  return message
}

export const LISTING_PANEL_HIRING_EMPTY_MESSAGE = 'Deze zaak zoekt momenteel geen personeel.'

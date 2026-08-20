import { listingHasGidsPremium } from '@/lib/gids-premium'
import { formatGidsTitleCase, formatGidsSentenceText } from '@/lib/gids-text'
import {
  formatListingHiringPanelMessage,
  LISTING_PANEL_HIRING_EMPTY_MESSAGE,
  listingHiringIsActive,
  normalizeHiringJobTypes,
  type HiringJobTypeId,
} from '@/lib/listing-hiring'
import { normalizeHttpsUrl } from '@/lib/normalize-url'
import { normalizeListingScheduleExtras, parseScheduleExtrasJson } from '@/lib/listing-schedule-extras'

export type ListingSpecialtyItem = {
  caption: string
  imageUrl?: string
}

export type ListingInfoExtras = {
  specialties?: ListingSpecialtyItem[]
  hiring?: {
    enabled: boolean
    title?: string
    text?: string
    phone?: string
    email?: string
    hours?: string
    jobTypes?: HiringJobTypeId[]
  }
  giftCard?: {
    enabled: boolean
    intro?: string
    orderUrl?: string
    valueEur?: number | null
  }
  schedule?: import('@/lib/listing-schedule-extras').ListingScheduleExtras
}

const MAX_SPECIALTIES = 3

export function normalizeListingInfoExtras(raw: unknown): ListingInfoExtras | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const o = raw as Record<string, unknown>
  const out: ListingInfoExtras = {}

  if (Array.isArray(o.specialties)) {
    const specialties: ListingSpecialtyItem[] = []
    for (const item of o.specialties.slice(0, MAX_SPECIALTIES)) {
      if (!item || typeof item !== 'object') continue
      const row = item as Record<string, unknown>
      const caption = String(row.caption ?? '').trim()
      const imageUrl = String(row.imageUrl ?? '').trim()
      if (!caption && !imageUrl) continue
      specialties.push({
        caption,
        ...(imageUrl ? { imageUrl } : {}),
      })
    }
    if (specialties.length) out.specialties = specialties
  }

  if (o.hiring && typeof o.hiring === 'object') {
    const h = o.hiring as Record<string, unknown>
    if (h.enabled === true) {
      const title = formatGidsTitleCase(String(h.title ?? '').trim())
      const text = formatGidsSentenceText(String(h.text ?? '').trim())
      const phone = String(h.phone ?? '').trim()
      const email = String(h.email ?? '').trim()
      const hours = formatGidsSentenceText(String(h.hours ?? '').trim())
      const jobTypes = normalizeHiringJobTypes(h.jobTypes)
      if (title || text || phone || email || hours || jobTypes.length) {
        out.hiring = {
          enabled: true,
          title: title || undefined,
          text: text || undefined,
          phone: phone || undefined,
          email: email || undefined,
          hours: hours || undefined,
          ...(jobTypes.length ? { jobTypes } : {}),
        }
      }
    }
  }

  if (o.giftCard && typeof o.giftCard === 'object') {
    const g = o.giftCard as Record<string, unknown>
    if (g.enabled === true) {
      const intro = String(g.intro ?? '').trim()
      let orderUrl = String(g.orderUrl ?? '').trim()
      if (orderUrl) {
        const norm = normalizeHttpsUrl(orderUrl)
        orderUrl = norm.ok ? norm.url : orderUrl
      }
      const valueRaw = g.valueEur
      const valueEur =
        valueRaw == null || valueRaw === ''
          ? null
          : Number(typeof valueRaw === 'string' ? valueRaw.replace(',', '.') : valueRaw)
      out.giftCard = {
        enabled: true,
        intro: intro || undefined,
        orderUrl: orderUrl || undefined,
        valueEur: Number.isFinite(valueEur) && valueEur! >= 0 ? valueEur : null,
      }
    }
  }

  const schedule = normalizeListingScheduleExtras(o.schedule)
  if (schedule) out.schedule = schedule

  return Object.keys(out).length ? out : undefined
}

export function listingHasInfoExtras(extras: ListingInfoExtras | undefined): boolean {
  if (!extras) return false
  if (extras.specialties?.length) return true
  if (extras.hiring?.enabled) return true
  if (extras.giftCard?.enabled) return true
  return false
}

/** Zoekkaart: vacaturebalk altijd zichtbaar; knop alleen bij actieve vacature. */
export function resolveListingPanelHiring(
  extras: ListingInfoExtras | undefined,
  premiumMember?: boolean,
): {
  active: boolean
  message: string
  phone?: string
} {
  const h = extras?.hiring
  if (h && listingHiringIsActive(h) && listingHasGidsPremium(premiumMember)) {
    const phone = h.phone?.trim() ?? ''
    return {
      active: true,
      message: formatListingHiringPanelMessage(h),
      ...(phone ? { phone } : {}),
    }
  }
  return { active: false, message: LISTING_PANEL_HIRING_EMPTY_MESSAGE }
}

/** @deprecated Gebruik resolveListingPanelHiring */
export function resolveListingPanelHiringBanner(
  extras: ListingInfoExtras | undefined,
): { message: string; phone?: string } | null {
  const state = resolveListingPanelHiring(extras)
  if (!state.active) return null
  return { message: state.message, ...(state.phone ? { phone: state.phone } : {}) }
}

export type ParsedInfoExtrasForm = {
  specialties: ListingSpecialtyItem[]
  hiringEnabled: boolean
  hiringTitle: string
  hiringText: string
  hiringPhone: string
  hiringEmail: string
  hiringHours: string
  hiringJobTypes: HiringJobTypeId[]
  giftEnabled: boolean
  giftIntro: string
  giftOrderUrl: string
  giftValueEur: number | null
  specialtyPhotos: { index: number; file: File }[]
  removeSpecialtyPhoto: boolean[]
  scheduleExtrasJson: string
  scheduleExtras?: ReturnType<typeof parseScheduleExtrasJson>
}

export function parseInfoExtrasFromForm(form: FormData): ParsedInfoExtrasForm {
  const specialties: ListingSpecialtyItem[] = []
  const removeSpecialtyPhoto: boolean[] = []
  const specialtyPhotos: { index: number; file: File }[] = []

  for (let i = 0; i < MAX_SPECIALTIES; i++) {
    const caption = formatGidsTitleCase(String(form.get(`infoSpecialtyCaption${i}`) ?? '').trim()).slice(0, 120)
    removeSpecialtyPhoto.push(String(form.get(`removeSpecialtyPhoto${i}`) ?? '') === '1')
    const file = form.get(`specialtyPhoto${i}`)
    if (file instanceof File && file.size > 0) {
      specialtyPhotos.push({ index: i, file })
    }
    specialties.push({ caption })
  }

  return {
    specialties,
    hiringEnabled: form.get('infoHiringEnabled') === 'on',
    hiringTitle: formatGidsTitleCase(String(form.get('infoHiringTitle') ?? '').trim()).slice(0, 120),
    hiringText: formatGidsSentenceText(String(form.get('infoHiringText') ?? '').trim()).slice(0, 500),
    hiringPhone: String(form.get('infoHiringPhone') ?? '').trim().slice(0, 40),
    hiringEmail: String(form.get('infoHiringEmail') ?? '').trim().slice(0, 120),
    hiringHours: formatGidsSentenceText(String(form.get('infoHiringHours') ?? '').trim()).slice(0, 240),
    hiringJobTypes: normalizeHiringJobTypes(form.getAll('infoHiringJobType')),
    giftEnabled: form.get('infoGiftEnabled') === 'on',
    giftIntro: formatGidsSentenceText(String(form.get('infoGiftIntro') ?? '').trim()).slice(0, 500),
    giftOrderUrl: String(form.get('infoGiftOrderUrl') ?? '').trim(),
    giftValueEur: (() => {
      const raw = String(form.get('infoGiftValueEur') ?? '').trim().replace(',', '.')
      if (!raw) return null
      const n = Number(raw)
      return Number.isFinite(n) && n >= 0 ? n : null
    })(),
    specialtyPhotos,
    removeSpecialtyPhoto,
    scheduleExtrasJson: String(form.get('scheduleExtras') ?? ''),
    scheduleExtras: parseScheduleExtrasJson(String(form.get('scheduleExtras') ?? '')),
  }
}

export async function buildInfoExtrasPayload(
  parsed: ParsedInfoExtrasForm,
  existing: ListingInfoExtras | undefined,
  uploadSpecialty: (index: number, file: File) => Promise<string>,
): Promise<ListingInfoExtras | null> {
  const prev = existing?.specialties ?? []
  const specialties: ListingSpecialtyItem[] = []

  for (let i = 0; i < MAX_SPECIALTIES; i++) {
    const caption = parsed.specialties[i]?.caption ?? ''
    let imageUrl = prev[i]?.imageUrl
    const upload = parsed.specialtyPhotos.find((p) => p.index === i)
    if (upload) {
      imageUrl = await uploadSpecialty(i, upload.file)
    } else if (parsed.removeSpecialtyPhoto[i]) {
      imageUrl = undefined
    }
    if (!caption && !imageUrl) continue
    specialties.push({ caption, ...(imageUrl ? { imageUrl } : {}) })
  }

  const payload: ListingInfoExtras = {}
  if (specialties.length) payload.specialties = specialties

  if (
    parsed.hiringEnabled &&
    (parsed.hiringTitle ||
      parsed.hiringText ||
      parsed.hiringPhone ||
      parsed.hiringEmail ||
      parsed.hiringJobTypes.length)
  ) {
    payload.hiring = {
      enabled: true,
      title: parsed.hiringTitle || undefined,
      text: parsed.hiringText || undefined,
      phone: parsed.hiringPhone || undefined,
      email: parsed.hiringEmail || undefined,
      hours: parsed.hiringHours || undefined,
      ...(parsed.hiringJobTypes.length ? { jobTypes: parsed.hiringJobTypes } : {}),
    }
  }

  if (parsed.giftEnabled) {
    let orderUrl = parsed.giftOrderUrl
    if (orderUrl) {
      const norm = normalizeHttpsUrl(orderUrl)
      if (!norm.ok) throw new Error(`Cadeaubon-URL: ${norm.message}`)
      orderUrl = norm.url
    }
    payload.giftCard = {
      enabled: true,
      intro: parsed.giftIntro || undefined,
      orderUrl: orderUrl || undefined,
      valueEur: parsed.giftValueEur,
    }
  }

  if (parsed.scheduleExtrasJson.trim()) {
    if (parsed.scheduleExtras) payload.schedule = parsed.scheduleExtras
  } else if (existing?.schedule) {
    payload.schedule = existing.schedule
  }

  return Object.keys(payload).length ? payload : null
}

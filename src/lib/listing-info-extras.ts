import { normalizeHttpsUrl } from '@/lib/normalize-url'

export type ListingSpecialtyItem = {
  caption: string
  imageUrl?: string
}

export type ListingInfoExtras = {
  specialties?: ListingSpecialtyItem[]
  hiring?: {
    enabled: boolean
    text?: string
    phone?: string
  }
  giftCard?: {
    enabled: boolean
    intro?: string
    orderUrl?: string
    valueEur?: number | null
  }
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
      const text = String(h.text ?? '').trim()
      const phone = String(h.phone ?? '').trim()
      if (text || phone) {
        out.hiring = { enabled: true, text: text || undefined, phone: phone || undefined }
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

  return Object.keys(out).length ? out : undefined
}

export function listingHasInfoExtras(extras: ListingInfoExtras | undefined): boolean {
  if (!extras) return false
  if (extras.specialties?.length) return true
  if (extras.hiring?.enabled) return true
  if (extras.giftCard?.enabled) return true
  return false
}

export function listingInfoExtrasBadges(extras: ListingInfoExtras | undefined): string[] {
  if (!extras) return []
  const badges: string[] = []
  if (extras.specialties?.length) badges.push('Specialiteiten')
  if (extras.giftCard?.enabled) badges.push('Cadeaubon')
  return badges
}

/** Zoekkaart: onderaan tonen als eigenaar vacaturetekst en/of telefoon heeft ingevuld. */
export function resolveListingPanelHiringBanner(
  extras: ListingInfoExtras | undefined,
): { message: string; phone?: string } | null {
  const h = extras?.hiring
  if (!h?.enabled) return null
  const text = h.text?.trim() ?? ''
  const phone = h.phone?.trim() ?? ''
  if (!text && !phone) return null

  let message = text
  if (message && !/^wij zoeken\b/i.test(message)) {
    message = `Wij zoeken ${message.charAt(0).toLowerCase()}${message.slice(1)}`
  } else if (!message) {
    message = 'Wij zoeken personeel'
  }

  return { message, ...(phone ? { phone } : {}) }
}

export type ParsedInfoExtrasForm = {
  specialties: ListingSpecialtyItem[]
  hiringEnabled: boolean
  hiringText: string
  hiringPhone: string
  giftEnabled: boolean
  giftIntro: string
  giftOrderUrl: string
  giftValueEur: number | null
  specialtyPhotos: { index: number; file: File }[]
  removeSpecialtyPhoto: boolean[]
}

export function parseInfoExtrasFromForm(form: FormData): ParsedInfoExtrasForm {
  const specialties: ListingSpecialtyItem[] = []
  const removeSpecialtyPhoto: boolean[] = []
  const specialtyPhotos: { index: number; file: File }[] = []

  for (let i = 0; i < MAX_SPECIALTIES; i++) {
    const caption = String(form.get(`infoSpecialtyCaption${i}`) ?? '').trim().slice(0, 120)
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
    hiringText: String(form.get('infoHiringText') ?? '').trim().slice(0, 500),
    hiringPhone: String(form.get('infoHiringPhone') ?? '').trim().slice(0, 40),
    giftEnabled: form.get('infoGiftEnabled') === 'on',
    giftIntro: String(form.get('infoGiftIntro') ?? '').trim().slice(0, 500),
    giftOrderUrl: String(form.get('infoGiftOrderUrl') ?? '').trim(),
    giftValueEur: (() => {
      const raw = String(form.get('infoGiftValueEur') ?? '').trim().replace(',', '.')
      if (!raw) return null
      const n = Number(raw)
      return Number.isFinite(n) && n >= 0 ? n : null
    })(),
    specialtyPhotos,
    removeSpecialtyPhoto,
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

  if (parsed.hiringEnabled && (parsed.hiringText || parsed.hiringPhone)) {
    payload.hiring = {
      enabled: true,
      text: parsed.hiringText || undefined,
      phone: parsed.hiringPhone || undefined,
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

  return Object.keys(payload).length ? payload : null
}

import { LISTING_TYPES, type ListingAmenityId, type ListingDayHours } from '@/lib/listing-types'
import { closedDaysFromRows, summarizeOpeningHours } from '@/lib/gids-opening-hours'
import { isValidGidsPin } from '@/lib/gids-pin'
import { normalizeHttpsUrl } from '@/lib/normalize-url'
import { GIDS_REGISTER_MAX_PHOTO_BYTES, GIDS_REGISTER_MAX_TOTAL_PHOTO_BYTES } from '@/lib/gids-register-limits'
import { parseOwnerAmenitiesFromForm } from '@/lib/gids-owner-amenities'
import { WEEKDAYS_NL } from '@/lib/listing-info'

const VALID_TYPES = LISTING_TYPES.filter((t) => t.id !== 'all').map((t) => t.id)

export type ParsedGidsListingForm = {
  name: string
  pin: string | null
  type: string
  city: string
  postcode: string
  address: string
  province: string
  phone: string | null
  email: string
  websiteFinal: string
  orderUrlFinal: string
  hoursByDay: ListingDayHours[]
  openingHours: string
  closedDays: string | null
  deliveryFeeValue: number | null
  minOrderValue: number | null
  deliveryTimeMinValue: number | null
  deliveryTimeMaxValue: number | null
  photos: { index: number; file: File }[]
  removePhotoSlots: number[]
  ownerAmenities: ListingAmenityId[]
}

export type ParseGidsListingFormResult =
  | { ok: true; data: ParsedGidsListingForm }
  | { ok: false; error: string; status: number }

export async function parseGidsListingFormData(
  form: FormData,
  opts: { requirePin: boolean; requireNewPhotos: boolean },
): Promise<ParseGidsListingFormResult> {
  const name = String(form.get('name') ?? '').trim()
  const pinRaw = String(form.get('pin') ?? '').trim()
  const newPinRaw = String(form.get('newPin') ?? '').trim()
  const pin = opts.requirePin ? pinRaw : newPinRaw || null

  const type = String(form.get('type') ?? '').trim()
  const city = String(form.get('city') ?? '').trim()
  const postcode = String(form.get('postcode') ?? '').trim()
  const address = String(form.get('address') ?? '').trim()
  const orderUrl = String(form.get('orderUrl') ?? '').trim()
  const province = String(form.get('province') ?? '').trim()
  const phone = String(form.get('phone') ?? '').trim()
  const email = String(form.get('email') ?? '').trim()
  const website = String(form.get('website') ?? '').trim()
  const hoursByDayRaw = String(form.get('hoursByDay') ?? '').trim()
  const deliveryFeeRaw = String(form.get('deliveryFeeEur') ?? '').trim()
  const minOrderRaw = String(form.get('minOrderEur') ?? '').trim()
  const deliveryTimeMinRaw = String(form.get('deliveryTimeMin') ?? '').trim()
  const deliveryTimeMaxRaw = String(form.get('deliveryTimeMax') ?? '').trim()

  const deliveryFeeEur = deliveryFeeRaw === '' ? NaN : Number(deliveryFeeRaw.replace(',', '.'))
  const minOrderEur = minOrderRaw === '' ? NaN : Number(minOrderRaw.replace(',', '.'))
  const deliveryTimeMin = deliveryTimeMinRaw === '' ? NaN : Number.parseInt(deliveryTimeMinRaw, 10)
  const deliveryTimeMax = deliveryTimeMaxRaw === '' ? NaN : Number.parseInt(deliveryTimeMaxRaw, 10)

  if (name.length < 3) return { ok: false, error: 'Vul een volledige zaaknaam in.', status: 400 }
  if (opts.requirePin) {
    if (!isValidGidsPin(pinRaw)) return { ok: false, error: 'PIN moet 6 cijfers zijn.', status: 400 }
  } else if (newPinRaw && !isValidGidsPin(newPinRaw)) {
    return { ok: false, error: 'Nieuwe PIN moet 6 cijfers zijn.', status: 400 }
  }

  if (!VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
    return { ok: false, error: 'Kies een type zaak.', status: 400 }
  }
  if (!province) return { ok: false, error: 'Kies een provincie.', status: 400 }
  if (!city || !postcode || !address) {
    return { ok: false, error: 'Adres, postcode en gemeente zijn verplicht.', status: 400 }
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Vul een geldig e-mailadres in.', status: 400 }
  }

  const websiteNorm = normalizeHttpsUrl(website)
  if (!websiteNorm.ok) return { ok: false, error: `Website: ${websiteNorm.message}`, status: 400 }
  const websiteFinal = websiteNorm.url

  let orderUrlFinal = websiteFinal
  if (orderUrl) {
    const orderUrlNorm = normalizeHttpsUrl(orderUrl)
    if (!orderUrlNorm.ok) {
      return { ok: false, error: `Bestel- of reserveer-URL: ${orderUrlNorm.message}`, status: 400 }
    }
    orderUrlFinal = orderUrlNorm.url
  }

  let hoursByDay: ListingDayHours[]
  try {
    hoursByDay = JSON.parse(hoursByDayRaw) as ListingDayHours[]
  } catch {
    return { ok: false, error: 'Openingsuren ongeldig.', status: 400 }
  }
  if (!Array.isArray(hoursByDay) || hoursByDay.length !== WEEKDAYS_NL.length) {
    return { ok: false, error: 'Vul alle dagen in voor openingsuren.', status: 400 }
  }
  for (const row of hoursByDay) {
    if (!WEEKDAYS_NL.includes(row.day as (typeof WEEKDAYS_NL)[number])) {
      return { ok: false, error: 'Onbekende dag in openingsuren.', status: 400 }
    }
    if (!row.hours?.trim()) {
      return { ok: false, error: 'Elke dag moet uren of «gesloten» hebben.', status: 400 }
    }
  }
  if (hoursByDay.every((r) => r.hours.toLowerCase() === 'gesloten')) {
    return { ok: false, error: 'Minstens één dag moet open zijn.', status: 400 }
  }

  const openingHours = summarizeOpeningHours(hoursByDay)
  const closedDays = closedDaysFromRows(hoursByDay)

  let deliveryFeeValue: number | null = null
  if (deliveryFeeRaw !== '') {
    if (!Number.isFinite(deliveryFeeEur) || deliveryFeeEur < 0) {
      return { ok: false, error: 'Vul geldige leveringskosten in (0 = gratis).', status: 400 }
    }
    deliveryFeeValue = deliveryFeeEur
  }

  let minOrderValue: number | null = null
  if (minOrderRaw !== '') {
    if (!Number.isFinite(minOrderEur) || minOrderEur < 0) {
      return { ok: false, error: 'Vul een geldig minimum bestelbedrag in.', status: 400 }
    }
    minOrderValue = minOrderEur
  }

  let deliveryTimeMinValue: number | null = null
  let deliveryTimeMaxValue: number | null = null
  if (deliveryTimeMinRaw !== '') {
    if (!Number.isInteger(deliveryTimeMin) || deliveryTimeMin < 1 || deliveryTimeMin > 180) {
      return { ok: false, error: 'Levertijd vanaf: kies 1–180 minuten.', status: 400 }
    }
    deliveryTimeMinValue = deliveryTimeMin
  }
  if (deliveryTimeMaxRaw !== '') {
    if (!Number.isInteger(deliveryTimeMax) || deliveryTimeMax < 1 || deliveryTimeMax > 240) {
      return { ok: false, error: 'Levertijd tot: kies 1–240 minuten.', status: 400 }
    }
    deliveryTimeMaxValue = deliveryTimeMax
  }
  if ((deliveryTimeMinValue == null) !== (deliveryTimeMaxValue == null)) {
    return { ok: false, error: 'Vul beide levertijden in of laat beide leeg.', status: 400 }
  }
  if (
    deliveryTimeMinValue != null &&
    deliveryTimeMaxValue != null &&
    deliveryTimeMaxValue < deliveryTimeMinValue
  ) {
    return { ok: false, error: 'Levertijd tot moet minstens gelijk zijn aan vanaf.', status: 400 }
  }

  const removePhotoSlots: number[] = []
  for (let i = 0; i < 3; i++) {
    if (String(form.get(`removePhoto${i}`) ?? '') === '1') removePhotoSlots.push(i)
  }

  const photos: { index: number; file: File }[] = []
  for (let i = 0; i < 3; i++) {
    const f = form.get(`photo${i}`)
    if (f instanceof File && f.size > 0) photos.push({ index: i, file: f })
  }

  if (opts.requireNewPhotos && photos.length === 0) {
    return { ok: false, error: 'Upload minstens 1 foto (max. 3).', status: 400 }
  }

  let totalPhotoBytes = 0
  for (const { file } of photos) {
    if (!file.type.startsWith('image/')) {
      return { ok: false, error: 'Alleen afbeeldingen toegestaan.', status: 400 }
    }
    if (file.size > GIDS_REGISTER_MAX_PHOTO_BYTES) {
      return {
        ok: false,
        error: `Elke foto max. ${Math.round(GIDS_REGISTER_MAX_PHOTO_BYTES / (1024 * 1024))} MB (serverlimiet). Kies een kleinere afbeelding.`,
        status: 400,
      }
    }
    totalPhotoBytes += file.size
  }
  if (totalPhotoBytes > GIDS_REGISTER_MAX_TOTAL_PHOTO_BYTES) {
    return {
      ok: false,
      error: "Foto's samen te groot (max. ca. 4 MB). Upload minder foto's of verklein ze.",
      status: 400,
    }
  }

  return {
    ok: true,
    data: {
      name,
      pin: opts.requirePin ? pinRaw : newPinRaw || null,
      type,
      city,
      postcode,
      address,
      province,
      phone: phone || null,
      email,
      websiteFinal,
      orderUrlFinal,
      hoursByDay,
      openingHours,
      closedDays,
      deliveryFeeValue,
      minOrderValue,
      deliveryTimeMinValue,
      deliveryTimeMaxValue,
      photos,
      removePhotoSlots,
      ownerAmenities: parseOwnerAmenitiesFromForm(form),
    },
  }
}

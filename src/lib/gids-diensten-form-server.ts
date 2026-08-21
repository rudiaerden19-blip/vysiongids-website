import { BELGIUM_PROVINCES } from '@/lib/belgium-locations'
import { isValidGidsPin } from '@/lib/gids-pin'
import {
  GIDS_DIENSTEN_MAX_PHOTOS,
  GIDS_DIENSTEN_MAX_TOTAL_PHOTO_BYTES,
  GIDS_REGISTER_MAX_PHOTO_BYTES,
} from '@/lib/gids-register-limits'
import { parseServiceCategoriesFromForm } from '@/lib/gids-service-categories'
import { formatGidsSentenceText, formatGidsTitleCase } from '@/lib/gids-text'
import { normalizeHttpsUrl } from '@/lib/normalize-url'

export type ParsedGidsDienstenForm = {
  name: string
  pin: string
  city: string
  postcode: string
  address: string
  province: string
  phone: string
  email: string | null
  websiteFinal: string | null
  serviceDescription: string
  serviceCategories: ReturnType<typeof parseServiceCategoriesFromForm>
  photos: { index: number; file: File }[]
  removePhotoSlots: number[]
}

export type ParseGidsDienstenOptions = {
  requirePin?: boolean
  requirePhotos?: boolean
}

export type ParseGidsDienstenFormResult =
  | { ok: true; data: ParsedGidsDienstenForm }
  | { ok: false; error: string; status: number }

export async function parseGidsDienstenFormData(
  form: FormData,
  options: ParseGidsDienstenOptions = {},
): Promise<ParseGidsDienstenFormResult> {
  const requirePin = options.requirePin !== false
  const requirePhotos = options.requirePhotos !== false
  const name = formatGidsTitleCase(String(form.get('name') ?? '').trim())
  const pinRaw = String(form.get('pin') ?? '').trim()
  const city = formatGidsTitleCase(String(form.get('city') ?? '').trim())
  const postcode = String(form.get('postcode') ?? '').trim()
  const address = formatGidsTitleCase(String(form.get('address') ?? '').trim())
  const province = String(form.get('province') ?? '').trim()
  const phone = String(form.get('phone') ?? '').trim()
  const email = String(form.get('email') ?? '').trim()
  const website = String(form.get('website') ?? '').trim()
  const descriptionRaw = formatGidsSentenceText(String(form.get('serviceDescription') ?? '').trim())

  if (name.length < 3) return { ok: false, error: 'Vul een volledige bedrijfsnaam in.', status: 400 }
  if (requirePin && !isValidGidsPin(pinRaw)) return { ok: false, error: 'PIN moet 6 cijfers zijn.', status: 400 }
  if (!requirePin && pinRaw && !isValidGidsPin(pinRaw)) {
    return { ok: false, error: 'Nieuwe PIN moet 6 cijfers zijn.', status: 400 }
  }
  if (!province || !BELGIUM_PROVINCES.some((p) => p.slug === province)) {
    return { ok: false, error: 'Kies een provincie.', status: 400 }
  }
  if (!city || !postcode || !address) {
    return { ok: false, error: 'Adres, postcode en gemeente zijn verplicht.', status: 400 }
  }
  if (!phone || phone.replace(/\D/g, '').length < 8) {
    return { ok: false, error: 'Telefoonnummer is verplicht (minstens 8 cijfers).', status: 400 }
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Vul een geldig e-mailadres in, of laat het veld leeg.', status: 400 }
  }
  if (descriptionRaw.length < 20) {
    return { ok: false, error: 'Beschrijf je diensten in minstens 20 tekens.', status: 400 }
  }
  if (descriptionRaw.length > 2000) {
    return { ok: false, error: 'Beschrijving is te lang (max. 2000 tekens).', status: 400 }
  }

  const serviceCategories = parseServiceCategoriesFromForm(form)
  if (serviceCategories.length === 0) {
    return { ok: false, error: 'Kies minstens één categorie (kassa, meubilair, …).', status: 400 }
  }

  let websiteFinal: string | null = null
  if (website) {
    const websiteNorm = normalizeHttpsUrl(website)
    if (!websiteNorm.ok) return { ok: false, error: `Website: ${websiteNorm.message}`, status: 400 }
    websiteFinal = websiteNorm.url
  }

  const photos: { index: number; file: File }[] = []
  for (let i = 0; i < GIDS_DIENSTEN_MAX_PHOTOS; i++) {
    const f = form.get(`photo${i}`)
    if (f instanceof File && f.size > 0) photos.push({ index: i, file: f })
  }
  if (photos.length === 0 && requirePhotos) {
    return { ok: false, error: 'Upload minstens 1 foto (max. 10).', status: 400 }
  }

  const removePhotoSlots: number[] = []
  for (let i = 0; i < GIDS_DIENSTEN_MAX_PHOTOS; i++) {
    if (String(form.get(`removePhoto${i}`) ?? '') === '1') removePhotoSlots.push(i)
  }

  let totalPhotoBytes = 0
  for (const { file } of photos) {
    if (!file.type.startsWith('image/')) {
      return { ok: false, error: 'Alleen afbeeldingen toegestaan.', status: 400 }
    }
    if (file.size > GIDS_REGISTER_MAX_PHOTO_BYTES) {
      return {
        ok: false,
        error: `Elke foto max. ${Math.round(GIDS_REGISTER_MAX_PHOTO_BYTES / (1024 * 1024))} MB.`,
        status: 400,
      }
    }
    totalPhotoBytes += file.size
  }
  if (totalPhotoBytes > GIDS_DIENSTEN_MAX_TOTAL_PHOTO_BYTES) {
    return { ok: false, error: "Foto's samen te groot. Upload minder of verklein ze.", status: 400 }
  }

  return {
    ok: true,
    data: {
      name,
      pin: pinRaw,
      city,
      postcode,
      address,
      province,
      phone,
      email: email || null,
      websiteFinal,
      serviceDescription: descriptionRaw,
      serviceCategories,
      photos,
      removePhotoSlots,
    },
  }
}

import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { hashGidsPin, isValidGidsPin } from '@/lib/gids-pin'
import { normalizeGidsBusinessName, slugifyListing } from '@/lib/gids-text'
import { fetchListingByNormalizedNameAdmin } from '@/lib/gids-listings-db'
import { createGidsSupabaseAdmin } from '@/lib/supabase-gids'
import { LISTING_TYPES, type ListingDayHours } from '@/lib/listing-types'
import { closedDaysFromRows, summarizeOpeningHours } from '@/lib/gids-opening-hours'
import { normalizeHttpsUrl } from '@/lib/normalize-url'
import { WEEKDAYS_NL } from '@/lib/listing-info'

const VALID_TYPES = LISTING_TYPES.filter((t) => t.id !== 'all').map((t) => t.id)
const MAX_PHOTO_BYTES = 5 * 1024 * 1024

function siteOrigin(req: Request): string {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  const proto = req.headers.get('x-forwarded-proto') ?? 'https'
  if (host) return `${proto}://${host}`
  return process.env.NEXT_PUBLIC_VYSIONGIDS_SITE_URL ?? 'https://www.vysiongids.be'
}

export async function POST(req: Request) {
  const admin = createGidsSupabaseAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Database niet geconfigureerd.' }, { status: 503 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Ongeldig formulier.' }, { status: 400 })
  }

  const name = String(form.get('name') ?? '').trim()
  const pin = String(form.get('pin') ?? '').trim()
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

  if (name.length < 3) return NextResponse.json({ error: 'Vul een volledige zaaknaam in.' }, { status: 400 })
  if (!isValidGidsPin(pin)) return NextResponse.json({ error: 'PIN moet 6 cijfers zijn.' }, { status: 400 })
  if (!VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
    return NextResponse.json({ error: 'Kies een type zaak.' }, { status: 400 })
  }
  if (!province) {
    return NextResponse.json({ error: 'Kies een provincie.' }, { status: 400 })
  }
  if (!city || !postcode || !address) {
    return NextResponse.json({ error: 'Adres, postcode en gemeente zijn verplicht.' }, { status: 400 })
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Vul een geldig e-mailadres in.' }, { status: 400 })
  }
  const websiteNorm = normalizeHttpsUrl(website)
  if (!websiteNorm.ok) {
    return NextResponse.json({ error: `Website: ${websiteNorm.message}` }, { status: 400 })
  }
  const websiteFinal = websiteNorm.url

  let orderUrlFinal = websiteFinal
  if (orderUrl) {
    const orderUrlNorm = normalizeHttpsUrl(orderUrl)
    if (!orderUrlNorm.ok) {
      return NextResponse.json({ error: `Bestel- of reserveer-URL: ${orderUrlNorm.message}` }, { status: 400 })
    }
    orderUrlFinal = orderUrlNorm.url
  }

  const phoneFinal = phone || null

  let hoursByDay: ListingDayHours[]
  try {
    hoursByDay = JSON.parse(hoursByDayRaw) as ListingDayHours[]
  } catch {
    return NextResponse.json({ error: 'Openingsuren ongeldig.' }, { status: 400 })
  }
  if (!Array.isArray(hoursByDay) || hoursByDay.length !== WEEKDAYS_NL.length) {
    return NextResponse.json({ error: 'Vul alle dagen in voor openingsuren.' }, { status: 400 })
  }
  for (const row of hoursByDay) {
    if (!WEEKDAYS_NL.includes(row.day as (typeof WEEKDAYS_NL)[number])) {
      return NextResponse.json({ error: 'Onbekende dag in openingsuren.' }, { status: 400 })
    }
    if (!row.hours?.trim()) {
      return NextResponse.json({ error: 'Elke dag moet uren of «gesloten» hebben.' }, { status: 400 })
    }
  }
  if (hoursByDay.every((r) => r.hours.toLowerCase() === 'gesloten')) {
    return NextResponse.json({ error: 'Minstens één dag moet open zijn.' }, { status: 400 })
  }

  const openingHours = summarizeOpeningHours(hoursByDay)
  const closedDays = closedDaysFromRows(hoursByDay)

  let deliveryFeeValue: number | null = null
  if (deliveryFeeRaw !== '') {
    if (!Number.isFinite(deliveryFeeEur) || deliveryFeeEur < 0) {
      return NextResponse.json({ error: 'Vul geldige leveringskosten in (0 = gratis).' }, { status: 400 })
    }
    deliveryFeeValue = deliveryFeeEur
  }

  let minOrderValue: number | null = null
  if (minOrderRaw !== '') {
    if (!Number.isFinite(minOrderEur) || minOrderEur < 0) {
      return NextResponse.json({ error: 'Vul een geldig minimum bestelbedrag in.' }, { status: 400 })
    }
    minOrderValue = minOrderEur
  }

  let deliveryTimeMinValue: number | null = null
  let deliveryTimeMaxValue: number | null = null
  if (deliveryTimeMinRaw !== '') {
    if (!Number.isInteger(deliveryTimeMin) || deliveryTimeMin < 1 || deliveryTimeMin > 180) {
      return NextResponse.json({ error: 'Levertijd vanaf: kies 1–180 minuten.' }, { status: 400 })
    }
    deliveryTimeMinValue = deliveryTimeMin
  }
  if (deliveryTimeMaxRaw !== '') {
    if (!Number.isInteger(deliveryTimeMax) || deliveryTimeMax < 1 || deliveryTimeMax > 240) {
      return NextResponse.json({ error: 'Levertijd tot: kies 1–240 minuten.' }, { status: 400 })
    }
    deliveryTimeMaxValue = deliveryTimeMax
  }
  if (
    (deliveryTimeMinValue == null) !== (deliveryTimeMaxValue == null)
  ) {
    return NextResponse.json({ error: 'Vul beide levertijden in of laat beide leeg.' }, { status: 400 })
  }
  if (
    deliveryTimeMinValue != null &&
    deliveryTimeMaxValue != null &&
    deliveryTimeMaxValue < deliveryTimeMinValue
  ) {
    return NextResponse.json({ error: 'Levertijd tot moet minstens gelijk zijn aan vanaf.' }, { status: 400 })
  }

  const nameNormalized = normalizeGidsBusinessName(name)
  const existing = await fetchListingByNormalizedNameAdmin(nameNormalized)
  if (existing) {
    return NextResponse.json({ error: 'Deze zaaknaam staat al in de gids.' }, { status: 409 })
  }

  const photos: File[] = []
  for (let i = 0; i < 3; i++) {
    const f = form.get(`photo${i}`)
    if (f instanceof File && f.size > 0) photos.push(f)
  }
  if (photos.length === 0) {
    return NextResponse.json({ error: 'Upload minstens 1 foto (max. 3).' }, { status: 400 })
  }
  if (photos.length !== 3) {
    return NextResponse.json({ error: 'Upload precies 3 foto\'s.' }, { status: 400 })
  }
  if (photos.length > 3) {
    return NextResponse.json({ error: 'Maximaal 3 foto\'s.' }, { status: 400 })
  }

  for (const file of photos) {
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Alleen afbeeldingen toegestaan.' }, { status: 400 })
    }
    if (file.size > MAX_PHOTO_BYTES) {
      return NextResponse.json({ error: 'Elke foto max. 5 MB.' }, { status: 400 })
    }
  }

  let slug = slugifyListing(name, city)
  const { data: slugHit } = await admin.from('gids_listings').select('slug').eq('slug', slug).maybeSingle()
  if (slugHit) slug = `${slug}-${Date.now().toString(36).slice(-4)}`

  const pinHash = hashGidsPin(pin)

  const { data: inserted, error: insertErr } = await admin
    .from('gids_listings')
    .insert({
      slug,
      name,
      name_normalized: nameNormalized,
      pin_hash: pinHash,
      type,
      city,
      postcode,
      province,
      address,
      order_url: orderUrlFinal,
      website: websiteFinal,
      phone: phoneFinal,
      email,
      opening_hours: openingHours,
      closed_days: closedDays,
      hours_by_day: hoursByDay,
      status: 'published',
      rating_avg: 0,
      rating_count: 0,
      pickup_enabled: true,
      delivery_enabled: true,
      delivery_fee_eur: deliveryFeeValue,
      min_order_eur: minOrderValue,
      delivery_time_min: deliveryTimeMinValue,
      delivery_time_max: deliveryTimeMaxValue,
    })
    .select('id, slug')
    .single()

  if (insertErr || !inserted) {
    console.error('[gids register]', insertErr?.message)
    return NextResponse.json({ error: 'Opslaan mislukt. Probeer later opnieuw.' }, { status: 500 })
  }

  const origin = siteOrigin(req)
  const publicUrls: string[] = []

  for (let i = 0; i < photos.length; i++) {
    const file = photos[i]
    const ext = file.type.includes('png') ? 'png' : file.type.includes('webp') ? 'webp' : 'jpg'
    const path = `${inserted.id}/${i}.${ext}`
    const buf = Buffer.from(await file.arrayBuffer())
    const { error: upErr } = await admin.storage.from('gids-listing-photos').upload(path, buf, {
      contentType: file.type,
      upsert: true,
    })
    if (upErr) {
      console.error('[gids photo upload]', upErr.message)
      await admin.from('gids_listings').delete().eq('id', inserted.id)
      return NextResponse.json({ error: 'Foto upload mislukt.' }, { status: 500 })
    }
    const { data: pub } = admin.storage.from('gids-listing-photos').getPublicUrl(path)
    const publicUrl = pub.publicUrl.startsWith('http') ? pub.publicUrl : `${origin}${pub.publicUrl}`
    publicUrls.push(publicUrl)
    const { error: photoErr } = await admin.from('gids_listing_photos').insert({
      listing_id: inserted.id,
      sort_order: i,
      storage_path: path,
      public_url: publicUrl,
    })
    if (photoErr) {
      console.error('[gids photo row]', photoErr.message)
    }
  }

  revalidateTag('gids-listings', 'max')

  return NextResponse.json({
    ok: true,
    slug: inserted.slug,
    url: `/zaak/${inserted.slug}`,
    photoCount: publicUrls.length,
  })
}

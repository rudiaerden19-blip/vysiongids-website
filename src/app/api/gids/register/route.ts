import { NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { hashGidsPin } from '@/lib/gids-pin'
import { normalizeGidsBusinessName, slugifyListing } from '@/lib/gids-text'
import { fetchListingByNormalizedNameAdmin } from '@/lib/gids-listings-db'
import { createGidsSupabaseAdmin } from '@/lib/supabase-gids'
import { parseGidsListingFormData } from '@/lib/gids-listing-form-server'
import { siteOriginFromRequest, uploadGidsListingPhoto, ensureGidsPhotosBucket } from '@/lib/gids-listing-photos-server'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    return await handleRegisterPost(req)
  } catch (err) {
    console.error('[gids register] unhandled', err)
    return NextResponse.json({ error: 'Registratie mislukt door een serverfout.' }, { status: 500 })
  }
}

async function handleRegisterPost(req: Request) {
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

  const parsed = await parseGidsListingFormData(form, { requirePin: true, requireNewPhotos: true })
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  const d = parsed.data

  const bucketReady = await ensureGidsPhotosBucket(admin)
  if (!bucketReady.ok) {
    return NextResponse.json({ error: bucketReady.message }, { status: 503 })
  }

  const nameNormalized = normalizeGidsBusinessName(d.name)
  const existing = await fetchListingByNormalizedNameAdmin(nameNormalized)
  if (existing) {
    return NextResponse.json({ error: 'Deze zaaknaam staat al in de gids.' }, { status: 409 })
  }

  let slug = slugifyListing(d.name, d.city)
  const { data: slugHit } = await admin.from('gids_listings').select('slug').eq('slug', slug).maybeSingle()
  if (slugHit) slug = `${slug}-${Date.now().toString(36).slice(-4)}`

  const pinHash = hashGidsPin(d.pin!)

  const { data: inserted, error: insertErr } = await admin
    .from('gids_listings')
    .insert({
      slug,
      name: d.name,
      name_normalized: nameNormalized,
      pin_hash: pinHash,
      type: d.type,
      city: d.city,
      postcode: d.postcode,
      province: d.province,
      address: d.address,
      order_url: d.orderUrlFinal,
      website: d.websiteFinal,
      phone: d.phone,
      email: d.email,
      opening_hours: d.openingHours,
      closed_days: d.closedDays,
      hours_by_day: d.hoursByDay,
      amenities: d.ownerAmenities.length ? d.ownerAmenities : null,
      status: 'published',
      rating_avg: 0,
      rating_count: 0,
      pickup_enabled: true,
      delivery_enabled: true,
      delivery_fee_eur: d.deliveryFeeValue,
      min_order_eur: d.minOrderValue,
      delivery_time_min: d.deliveryTimeMinValue,
      delivery_time_max: d.deliveryTimeMaxValue,
    })
    .select('id, slug')
    .single()

  if (insertErr || !inserted) {
    console.error('[gids register]', insertErr?.message, insertErr?.code)
    const msg = insertErr?.message?.includes('duplicate')
      ? 'Deze zaaknaam of slug bestaat al.'
      : 'Opslaan mislukt. Probeer later opnieuw.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  const origin = siteOriginFromRequest(req)

  try {
    await Promise.all(
      d.photos.map(({ index, file }) => uploadGidsListingPhoto(admin, inserted.id, index, file, origin)),
    )
  } catch (uploadErr) {
    const message = uploadErr instanceof Error ? uploadErr.message : 'Onbekende uploadfout'
    console.error('[gids photo upload]', message)
    await admin.from('gids_listings').delete().eq('id', inserted.id)
    const hint = /bucket|not found|404/i.test(message)
      ? ' Foto-opslag (bucket gids-listing-photos) ontbreekt in Supabase.'
      : ''
    return NextResponse.json({ error: `Foto upload mislukt.${hint}` }, { status: 500 })
  }

  try {
    revalidateTag('gids-listings', 'max')
    revalidatePath('/zoeken')
    revalidatePath(`/zaak/${inserted.slug}`)
  } catch (revalidateErr) {
    console.error('[gids register] revalidateTag', revalidateErr)
  }

  return NextResponse.json({
    ok: true,
    slug: inserted.slug,
    url: `/zaak/${inserted.slug}`,
    photoCount: d.photos.length,
  })
}

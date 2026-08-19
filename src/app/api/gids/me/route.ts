import { NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { GIDS_SESSION_COOKIE, getGidsOwnerListingIdFromCookies } from '@/lib/gids-session'
import { createGidsSupabaseAdmin } from '@/lib/supabase-gids'
import {
  mapGidsRowToListing,
  fetchListingRowByIdAdmin,
  fetchListingSessionByIdAdmin,
  fetchListingByNormalizedNameAdmin,
} from '@/lib/gids-listings-db'
import { parseGidsListingFormData } from '@/lib/gids-listing-form-server'
import { mergeListingAmenitiesWithOwnerChoices } from '@/lib/gids-owner-amenities'
import { applyCuisineTypeToUpdatePayload, applyDeliveryRadiusToUpdatePayload, gidsListingSaveErrorMessage } from '@/lib/gids-listing-db-write'
import { hashGidsPin } from '@/lib/gids-pin'
import { normalizeGidsBusinessName, slugifyListing } from '@/lib/gids-text'
import {
  ensureGidsPhotosBucket,
  GIDS_LISTING_PHOTOS_BUCKET,
  removeGidsListingPhotoSlot,
  siteOriginFromRequest,
  uploadGidsListingPhoto,
  uploadGidsListingSpecialtyPhoto,
} from '@/lib/gids-listing-photos-server'
import {
  buildInfoExtrasPayload,
  normalizeListingInfoExtras,
  parseInfoExtrasFromForm,
} from '@/lib/listing-info-extras'
import {
  removeGidsListingMenuPdfStorage,
  uploadGidsListingMenuPdf,
} from '@/lib/gids-listing-menu-server'
import { geocodeListingAddress } from '@/lib/gids-listing-geocode'

export const maxDuration = 60

export async function GET(req: Request) {
  const listingId = await getGidsOwnerListingIdFromCookies()
  if (!listingId) return NextResponse.json({ authenticated: false })

  const brief = new URL(req.url).searchParams.get('brief') === '1'
  if (brief) {
    const session = await fetchListingSessionByIdAdmin(listingId)
    if (!session) return NextResponse.json({ authenticated: false })
    return NextResponse.json({
      authenticated: true,
      listingId: session.id,
      slug: session.slug,
      name: session.name,
    })
  }

  const row = await fetchListingRowByIdAdmin(listingId)
  if (!row) return NextResponse.json({ authenticated: false })

  const listing = mapGidsRowToListing(row)
  return NextResponse.json({
    authenticated: true,
    listingId: row.id,
    slug: listing.slug,
    name: listing.name,
    listing,
  })
}

export async function DELETE() {
  const listingId = await getGidsOwnerListingIdFromCookies()
  if (!listingId) {
    return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })
  }

  const admin = createGidsSupabaseAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Database niet geconfigureerd.' }, { status: 503 })
  }

  const { data: photos } = await admin.from('gids_listing_photos').select('storage_path').eq('listing_id', listingId)
  if (photos?.length) {
    const paths = photos.map((p) => p.storage_path).filter(Boolean)
    if (paths.length) await admin.storage.from(GIDS_LISTING_PHOTOS_BUCKET).remove(paths)
  }
  const rowBeforeDelete = await fetchListingRowByIdAdmin(listingId)
  if (rowBeforeDelete?.menu_pdf_path) {
    await removeGidsListingMenuPdfStorage(admin, rowBeforeDelete.menu_pdf_path)
  }

  const { error } = await admin.from('gids_listings').delete().eq('id', listingId)
  if (error) {
    return NextResponse.json({ error: 'Verwijderen mislukt.' }, { status: 500 })
  }

  revalidateTag('gids-listings', 'max')
  revalidatePath('/')

  const res = NextResponse.json({ ok: true })
  res.cookies.set(GIDS_SESSION_COOKIE, '', { maxAge: 0, path: '/', httpOnly: true, sameSite: 'lax' })
  return res
}

export async function PATCH(req: Request) {
  const listingId = await getGidsOwnerListingIdFromCookies()
  if (!listingId) {
    return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })
  }

  const admin = createGidsSupabaseAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Database niet geconfigureerd.' }, { status: 503 })
  }

  const row = await fetchListingRowByIdAdmin(listingId)
  if (!row) {
    return NextResponse.json({ error: 'Zaak niet gevonden.' }, { status: 404 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Ongeldig formulier.' }, { status: 400 })
  }

  const parsed = await parseGidsListingFormData(form, { requirePin: false, requireNewPhotos: false })
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  const d = parsed.data

  const needsPhotoUpload = d.photos.length > 0 || d.removePhotoSlots.length > 0
  const infoExtrasForm = parseInfoExtrasFromForm(form)
  const needsSpecialtyUpload = infoExtrasForm.specialtyPhotos.length > 0
  const needsMenuUpload = Boolean(d.menuPdfFile) || d.removeMenuPdf
  if (needsPhotoUpload || needsMenuUpload || needsSpecialtyUpload) {
    const bucketReady = await ensureGidsPhotosBucket(admin)
    if (!bucketReady.ok) {
      return NextResponse.json({ error: bucketReady.message }, { status: 503 })
    }
  }

  const nameNormalized = normalizeGidsBusinessName(d.name)
  if (nameNormalized !== row.name_normalized) {
    const other = await fetchListingByNormalizedNameAdmin(nameNormalized)
    if (other && other.id !== listingId) {
      return NextResponse.json({ error: 'Deze zaaknaam is al in gebruik.' }, { status: 409 })
    }
  }

  let slug = row.slug
  if (d.name !== row.name || d.city !== row.city) {
    slug = slugifyListing(d.name, d.city)
    const { data: slugHit } = await admin
      .from('gids_listings')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    if (slugHit && slugHit.id !== listingId) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`
    }
  }

  const { data: photoRows } = await admin
    .from('gids_listing_photos')
    .select('sort_order, storage_path')
    .eq('listing_id', listingId)

  const photosBySlot = new Map<number, { storage_path: string }>()
  for (const p of photoRows ?? []) {
    photosBySlot.set(p.sort_order, { storage_path: p.storage_path })
  }

  const origin = siteOriginFromRequest(req)

  try {
    for (let index = 0; index < 3; index++) {
      const upload = d.photos.find((p) => p.index === index)
      if (upload) {
        await uploadGidsListingPhoto(admin, listingId, index, upload.file, origin)
        continue
      }
      if (d.removePhotoSlots.includes(index)) {
        const existing = photosBySlot.get(index)
        if (existing) {
          await removeGidsListingPhotoSlot(admin, listingId, index, existing.storage_path)
        }
      }
    }
  } catch (uploadErr) {
    const message = uploadErr instanceof Error ? uploadErr.message : 'Upload mislukt'
    console.error('[gids me patch photos]', message)
    return NextResponse.json({ error: `Foto's opslaan mislukt: ${message}` }, { status: 500 })
  }

  const { count: photoCount } = await admin
    .from('gids_listing_photos')
    .select('id', { count: 'exact', head: true })
    .eq('listing_id', listingId)

  if (!photoCount || photoCount < 1) {
    return NextResponse.json({ error: 'Je zaak moet minstens 1 foto hebben.' }, { status: 400 })
  }

  let menuPdfPath: string | null = row.menu_pdf_path ?? null
  let menuPdfPublicUrl: string | null = row.menu_pdf_public_url ?? null

  try {
    if (d.removeMenuPdf && menuPdfPath) {
      await removeGidsListingMenuPdfStorage(admin, menuPdfPath)
      menuPdfPath = null
      menuPdfPublicUrl = null
    }
    if (d.menuPdfFile) {
      if (menuPdfPath) {
        await removeGidsListingMenuPdfStorage(admin, menuPdfPath)
      }
      const uploaded = await uploadGidsListingMenuPdf(admin, listingId, d.menuPdfFile, origin)
      menuPdfPath = uploaded.path
      menuPdfPublicUrl = uploaded.publicUrl
    }
  } catch (menuErr) {
    const message = menuErr instanceof Error ? menuErr.message : 'Menu upload mislukt'
    console.error('[gids me patch menu]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const existingExtras = normalizeListingInfoExtras(row.info_extras)
  let infoExtrasPayload: Record<string, unknown> | null = null
  try {
    infoExtrasPayload = (await buildInfoExtrasPayload(
      infoExtrasForm,
      existingExtras,
      (index, file) => uploadGidsListingSpecialtyPhoto(admin, listingId, index, file, origin),
    )) as Record<string, unknown> | null
  } catch (infoErr) {
    const message = infoErr instanceof Error ? infoErr.message : 'INFO opslaan mislukt'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const updatePayload: Record<string, unknown> = {
    name: d.name,
    name_normalized: nameNormalized,
    slug,
    type: d.type,
    city: d.city,
    postcode: d.postcode,
    province: d.province,
    address: d.address,
    order_url: d.orderUrlFinal,
    menu_url: d.menuUrlFinal,
    menu_pdf_path: menuPdfPath,
    menu_pdf_public_url: menuPdfPublicUrl,
    website: d.websiteFinal,
    phone: d.phone,
    email: d.email,
    opening_hours: d.openingHours,
    closed_days: d.closedDays,
    hours_by_day: d.hoursByDay,
    amenities: mergeListingAmenitiesWithOwnerChoices(row.amenities, d.ownerAmenities),
    delivery_fee_eur: d.deliveryFeeValue,
    min_order_eur: d.minOrderValue,
    delivery_time_min: d.deliveryTimeMinValue,
    delivery_time_max: d.deliveryTimeMaxValue,
    pickup_time_min: d.pickupTimeMinValue,
    pickup_time_max: d.pickupTimeMaxValue,
    info_extras: infoExtrasPayload,
    updated_at: new Date().toISOString(),
  }

  if (d.pin) {
    updatePayload.pin_hash = hashGidsPin(d.pin)
  }

  applyCuisineTypeToUpdatePayload(updatePayload, d.cuisineType)
  applyDeliveryRadiusToUpdatePayload(updatePayload, d.deliveryRadiusKmValue)

  const coords = await geocodeListingAddress({
    address: d.address,
    postcode: d.postcode,
    city: d.city,
  })
  if (coords) {
    updatePayload.lat = coords.lat
    updatePayload.lng = coords.lng
  }

  const { error: updateErr } = await admin.from('gids_listings').update(updatePayload).eq('id', listingId)
  if (updateErr) {
    console.error('[gids me patch]', updateErr.message)
    return NextResponse.json({ error: gidsListingSaveErrorMessage(updateErr.message) }, { status: 500 })
  }

  revalidateTag('gids-listings', 'max')
  revalidatePath('/')
  revalidatePath('/zoeken')
  revalidatePath(`/zaak/${slug}`)
  revalidatePath(`/zaak/${slug}/menu`)
  if (slug !== row.slug) {
    revalidatePath(`/zaak/${row.slug}`)
    revalidatePath(`/zaak/${row.slug}/menu`)
  }

  return NextResponse.json({
    ok: true,
    slug,
    url: `/zaak/${slug}`,
    slugChanged: slug !== row.slug,
  })
}

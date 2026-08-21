import { NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchListingByNormalizedNameAdmin, type GidsListingRow } from '@/lib/gids-listings-db'
import { gidsListingSaveErrorMessage } from '@/lib/gids-listing-db-write'
import { parseGidsDienstenFormData } from '@/lib/gids-diensten-form-server'
import { applyGidsOwnerDienstenPhotoPatch } from '@/lib/gids-me-diensten-photo-patch'
import { geocodeListingAddress } from '@/lib/gids-listing-geocode'
import { hashGidsPin } from '@/lib/gids-pin'
import { normalizeGidsBusinessName, slugifyListing } from '@/lib/gids-text'
import { ensureGidsPhotosBucket, siteOriginFromRequest } from '@/lib/gids-listing-photos-server'
import { applyOwnerSessionRefresh, type VerifiedGidsSession } from '@/lib/gids-session'

export async function patchOwnerDienstenListing(
  req: Request,
  session: VerifiedGidsSession,
  row: GidsListingRow,
  admin: SupabaseClient,
  form: FormData,
) {
  const listingId = session.listingId

  if (row.listing_segment !== 'diensten') {
    return NextResponse.json({ error: 'Geen dienstenprofiel.' }, { status: 400 })
  }

  const parsed = await parseGidsDienstenFormData(form, { requirePin: false, requirePhotos: false })
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  const d = parsed.data

  const needsPhotoUpload = d.photos.length > 0 || d.removePhotoSlots.length > 0
  if (needsPhotoUpload) {
    const bucketReady = await ensureGidsPhotosBucket(admin)
    if (!bucketReady.ok) {
      return NextResponse.json({ error: bucketReady.message }, { status: 503 })
    }
  }

  const nameNormalized = normalizeGidsBusinessName(d.name)
  if (nameNormalized !== row.name_normalized) {
    const other = await fetchListingByNormalizedNameAdmin(nameNormalized)
    if (other && other.id !== listingId) {
      return NextResponse.json({ error: 'Deze bedrijfsnaam is al in gebruik.' }, { status: 409 })
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

  const origin = siteOriginFromRequest(req)

  if (needsPhotoUpload) {
    try {
      await applyGidsOwnerDienstenPhotoPatch(admin, listingId, {
        uploads: d.photos,
        removePhotoSlots: d.removePhotoSlots,
        origin,
      })
    } catch (uploadErr) {
      const message = uploadErr instanceof Error ? uploadErr.message : 'Upload mislukt'
      console.error('[gids me patch diensten photos]', message)
      return NextResponse.json({ error: `Foto's opslaan mislukt: ${message}` }, { status: 500 })
    }
  }

  const { count: photoCount } = await admin
    .from('gids_listing_photos')
    .select('id', { count: 'exact', head: true })
    .eq('listing_id', listingId)

  if (!photoCount || photoCount < 1) {
    return NextResponse.json({ error: 'Je profiel moet minstens 1 foto hebben.' }, { status: 400 })
  }

  const updatePayload: Record<string, unknown> = {
    name: d.name,
    name_normalized: nameNormalized,
    slug,
    city: d.city,
    postcode: d.postcode,
    province: d.province,
    address: d.address,
    website: d.websiteFinal,
    phone: d.phone,
    email: d.email,
    service_categories: d.serviceCategories,
    service_description: d.serviceDescription,
    updated_at: new Date().toISOString(),
  }

  if (d.pin) {
    updatePayload.pin_hash = hashGidsPin(d.pin)
  }

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
    console.error('[gids me patch diensten]', updateErr.message)
    return NextResponse.json({ error: gidsListingSaveErrorMessage(updateErr.message) }, { status: 500 })
  }

  revalidateTag('gids-listings', 'max')
  revalidatePath('/diensten')
  revalidatePath(`/diensten/${slug}`)
  if (slug !== row.slug) {
    revalidatePath(`/diensten/${row.slug}`)
  }

  return applyOwnerSessionRefresh(
    NextResponse.json({
      ok: true,
      slug,
      url: `/diensten/${slug}`,
      slugChanged: slug !== row.slug,
    }),
    session,
  )
}

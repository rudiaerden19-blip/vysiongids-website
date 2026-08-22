import { NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { hashGidsPin } from '@/lib/gids-pin'
import { normalizeGidsBusinessName, slugifyListing } from '@/lib/gids-text'
import { fetchListingByNormalizedNameAdmin } from '@/lib/gids-listings-db'
import { createGidsSupabaseAdmin } from '@/lib/supabase-gids'
import { parseGidsListingFormData } from '@/lib/gids-listing-form-server'
import { buildGidsListingInsertRow, gidsListingSaveErrorMessage } from '@/lib/gids-listing-db-write'
import { siteOriginFromRequest, uploadGidsListingPhoto, uploadGidsListingSpecialtyPhoto, ensureGidsPhotosBucket } from '@/lib/gids-listing-photos-server'
import { uploadGidsListingMenuPdf } from '@/lib/gids-listing-menu-server'
import { geocodeListingAddress } from '@/lib/gids-listing-geocode'
import {
  buildInfoExtrasPayload,
  parseInfoExtrasFromForm,
} from '@/lib/listing-info-extras'
import { enforceRateLimit } from '@/lib/gids-rate-limit'

export const maxDuration = 60

const REGISTER_WINDOW_MS = 60 * 60 * 1000
/** Geslaagde registraties per IP per uur (mislukte pogingen tellen niet mee). */
const REGISTER_SUCCESS_MAX_PER_IP = 30
/** Ruwe POST-limiet tegen spam (formulier-fouten, bots). */
const REGISTER_BURST_WINDOW_MS = 15 * 60 * 1000
const REGISTER_BURST_MAX_PER_IP = 25

export async function POST(req: Request) {
  try {
    return await handleRegisterPost(req)
  } catch (err) {
    console.error('[gids register] unhandled', err)
    return NextResponse.json({ error: 'Registratie mislukt door een serverfout.' }, { status: 500 })
  }
}

async function handleRegisterPost(req: Request) {
  const burstLimited = enforceRateLimit(
    req,
    'gids-register-burst',
    REGISTER_BURST_WINDOW_MS,
    REGISTER_BURST_MAX_PER_IP,
  )
  if (burstLimited) return burstLimited

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

  const coords = await geocodeListingAddress({
    address: d.address,
    postcode: d.postcode,
    city: d.city,
  })

  const successLimited = enforceRateLimit(
    req,
    'gids-register-success',
    REGISTER_WINDOW_MS,
    REGISTER_SUCCESS_MAX_PER_IP,
  )
  if (successLimited) return successLimited

  const { data: inserted, error: insertErr } = await admin
    .from('gids_listings')
    .insert(
      buildGidsListingInsertRow(d, {
        slug,
        nameNormalized,
        pinHash,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
      }),
    )
    .select('id, slug')
    .single()

  if (insertErr || !inserted) {
    console.error('[gids register]', insertErr?.message, insertErr?.code)
    return NextResponse.json({ error: gidsListingSaveErrorMessage(insertErr?.message) }, { status: 500 })
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

  if (d.menuPdfFile) {
    try {
      const uploaded = await uploadGidsListingMenuPdf(admin, inserted.id, d.menuPdfFile, origin)
      await admin
        .from('gids_listings')
        .update({
          menu_pdf_path: uploaded.path,
          menu_pdf_public_url: uploaded.publicUrl,
        })
        .eq('id', inserted.id)
    } catch (menuErr) {
      const message = menuErr instanceof Error ? menuErr.message : 'Menu upload mislukt'
      console.error('[gids menu upload]', message)
      await admin.from('gids_listings').delete().eq('id', inserted.id)
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }

  const infoExtrasForm = parseInfoExtrasFromForm(form)
  let infoExtrasPayload: Record<string, unknown> | null = null
  try {
    infoExtrasPayload = (await buildInfoExtrasPayload(
      infoExtrasForm,
      undefined,
      (index, file) => uploadGidsListingSpecialtyPhoto(admin, inserted.id, index, file, origin),
    )) as Record<string, unknown> | null
  } catch (infoErr) {
    const message = infoErr instanceof Error ? infoErr.message : 'INFO-blokken opslaan mislukt'
    await admin.from('gids_listings').delete().eq('id', inserted.id)
    return NextResponse.json({ error: message }, { status: 400 })
  }

  if (infoExtrasPayload) {
    const { error: extrasErr } = await admin
      .from('gids_listings')
      .update({ info_extras: infoExtrasPayload })
      .eq('id', inserted.id)
    if (extrasErr) {
      console.error('[gids register info_extras]', extrasErr.message)
      await admin.from('gids_listings').delete().eq('id', inserted.id)
      return NextResponse.json({ error: gidsListingSaveErrorMessage(extrasErr.message) }, { status: 500 })
    }
  }

  try {
    revalidateTag('gids-listings', 'max')
    revalidatePath('/')
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

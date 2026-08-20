import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getGidsOwnerListingIdFromCookies } from '@/lib/gids-session'
import { fetchListingRowByIdAdmin } from '@/lib/gids-listings-db'
import { resolveListingPremiumActive } from '@/lib/gids-premium'
import {
  createGidsZoekertjeAdmin,
  countGidsZoekertjesByListingIdAdmin,
  fetchGidsZoekertjesByListingIdAdmin,
  fetchPublishedGidsZoekertjesAdmin,
  replaceGidsZoekertjePhotosAdmin,
} from '@/lib/gids-zoekertjes-db'
import { normalizeGidsZoekertjePriceInput } from '@/lib/gids-zoekertjes-price'
import {
  normalizeZoekertjeDescriptionInput,
  normalizeZoekertjeOptionalLine,
  normalizeZoekertjeTitleInput,
} from '@/lib/gids-zoekertjes-text'
import { GIDS_ZOEKERTJE_MAX_PER_LISTING, GIDS_ZOEKERTJE_MAX_PHOTOS } from '@/lib/gids-zoekertjes-types'
import { ensureGidsPhotosBucket, siteOriginFromRequest } from '@/lib/gids-listing-photos-server'
import { createGidsSupabaseAdmin } from '@/lib/supabase-gids'

export const runtime = 'nodejs'
export const maxDuration = 60

function parseSaveFields(form: FormData) {
  const title = normalizeZoekertjeTitleInput(String(form.get('title') ?? ''))
  const description = normalizeZoekertjeDescriptionInput(String(form.get('description') ?? ''))
  const category = String(form.get('category') ?? '').trim()
  const condition = String(form.get('condition') ?? '').trim() || null
  const kind = String(form.get('kind') ?? '').trim() || null
  const itemTypeRaw = String(form.get('itemType') ?? '').trim()
  const brandRaw = String(form.get('brand') ?? '').trim()
  const itemType = itemTypeRaw ? normalizeZoekertjeOptionalLine(itemTypeRaw) : null
  const brand = brandRaw ? normalizeZoekertjeOptionalLine(brandRaw) : null
  const priceRaw = String(form.get('price') ?? form.get('priceClass') ?? '').trim()
  return { title, description, category, condition, kind, itemType, brand, priceRaw }
}

function collectPhotoFiles(form: FormData): { index: number; file: File }[] {
  const out: { index: number; file: File }[] = []
  for (let i = 0; i < GIDS_ZOEKERTJE_MAX_PHOTOS; i++) {
    const entry = form.get(`photo_${i}`)
    if (entry instanceof File && entry.size > 0) out.push({ index: i, file: entry })
  }
  return out
}

async function requirePremiumListing() {
  const listingId = await getGidsOwnerListingIdFromCookies()
  if (!listingId) return { error: NextResponse.json({ error: 'Log in met je zaak.' }, { status: 401 }) }
  const row = await fetchListingRowByIdAdmin(listingId)
  if (!row) return { error: NextResponse.json({ error: 'Zaak niet gevonden.' }, { status: 404 }) }
  if (!resolveListingPremiumActive(row)) {
    return {
      error: NextResponse.json(
        { error: 'Zoekertjes plaatsen is enkel voor premium-leden (€50/jaar).' },
        { status: 403 },
      ),
    }
  }
  return { listingId }
}

export async function GET() {
  const result = await fetchPublishedGidsZoekertjesAdmin()
  if (result === null) {
    return NextResponse.json({ error: 'Zoekertjes laden mislukt (database niet bereikbaar).' }, { status: 503 })
  }

  const ownerListingId = await getGidsOwnerListingIdFromCookies()
  return NextResponse.json({
    zoekertjes: result.zoekertjes,
    setupRequired: result.setupRequired === true,
    ownerListingId: ownerListingId ?? null,
  })
}

export async function POST(req: Request) {
  const auth = await requirePremiumListing()
  if ('error' in auth) return auth.error
  const { listingId } = auth

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Ongeldig formulier.' }, { status: 400 })
  }

  const fields = parseSaveFields(form)
  if (!fields.title) return NextResponse.json({ error: 'Titel is verplicht.' }, { status: 400 })
  if (!fields.description) return NextResponse.json({ error: 'Beschrijving is verplicht.' }, { status: 400 })
  if (!fields.category) return NextResponse.json({ error: 'Kies een categorie.' }, { status: 400 })
  const priceStored = normalizeGidsZoekertjePriceInput(fields.priceRaw)
  if (!priceStored) {
    return NextResponse.json({ error: 'Voer een geldige prijs in (bijv. 250 of 250,50).' }, { status: 400 })
  }

  const photos = collectPhotoFiles(form)
  if (photos.length > GIDS_ZOEKERTJE_MAX_PHOTOS) {
    return NextResponse.json({ error: `Maximaal ${GIDS_ZOEKERTJE_MAX_PHOTOS} foto's.` }, { status: 400 })
  }

  const existingCount = await countGidsZoekertjesByListingIdAdmin(listingId)
  if (existingCount === null) {
    return NextResponse.json({ error: 'Zoekertjes tellen mislukt.' }, { status: 503 })
  }
  if (existingCount >= GIDS_ZOEKERTJE_MAX_PER_LISTING) {
    return NextResponse.json(
      {
        error: `Je hebt het maximum van ${GIDS_ZOEKERTJE_MAX_PER_LISTING} zoekertjes per zaak bereikt. Verwijder eerst een oud zoekertje.`,
      },
      { status: 400 },
    )
  }

  const created = await createGidsZoekertjeAdmin(listingId, {
    title: fields.title,
    description: fields.description,
    category: fields.category,
    condition: fields.condition,
    kind: fields.kind,
    itemType: fields.itemType,
    brand: fields.brand,
    price: priceStored,
  })
  if (!created.ok) return NextResponse.json({ error: created.error }, { status: 500 })

  if (photos.length) {
    const admin = createGidsSupabaseAdmin()
    if (!admin) return NextResponse.json({ error: 'Database niet geconfigureerd.' }, { status: 503 })
    const bucketReady = await ensureGidsPhotosBucket(admin)
    if (!bucketReady.ok) return NextResponse.json({ error: bucketReady.message }, { status: 503 })

    const origin = siteOriginFromRequest(req)
    const uploaded = await replaceGidsZoekertjePhotosAdmin(created.id, photos, origin)
    if (!uploaded.ok) {
      return NextResponse.json({ error: `Foto's uploaden mislukt: ${uploaded.error}` }, { status: 500 })
    }
  }

  revalidatePath('/zoekertjes')
  return NextResponse.json({ ok: true, id: created.id })
}

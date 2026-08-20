import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getGidsOwnerListingIdFromCookies } from '@/lib/gids-session'
import { fetchListingRowByIdAdmin } from '@/lib/gids-listings-db'
import { resolveListingPremiumActive } from '@/lib/gids-premium'
import {
  deleteGidsZoekertjeAdmin,
  fetchGidsZoekertjeByIdAdmin,
  replaceGidsZoekertjePhotosAdmin,
  updateGidsZoekertjeAdmin,
  clearGidsZoekertjePhotosAdmin,
} from '@/lib/gids-zoekertjes-db'
import { normalizeGidsZoekertjePriceInput } from '@/lib/gids-zoekertjes-price'
import { GIDS_ZOEKERTJE_MAX_PHOTOS, GIDS_ZOEKERTJE_TITLE_MAX } from '@/lib/gids-zoekertjes-types'
import { ensureGidsPhotosBucket, siteOriginFromRequest } from '@/lib/gids-listing-photos-server'
import { createGidsSupabaseAdmin } from '@/lib/supabase-gids'

export const runtime = 'nodejs'
export const maxDuration = 60

type RouteCtx = { params: Promise<{ id: string }> }

function parseSaveFields(form: FormData) {
  const title = String(form.get('title') ?? '').trim().slice(0, GIDS_ZOEKERTJE_TITLE_MAX)
  const description = String(form.get('description') ?? '').trim().slice(0, 4000)
  const category = String(form.get('category') ?? '').trim()
  const condition = String(form.get('condition') ?? '').trim() || null
  const kind = String(form.get('kind') ?? '').trim() || null
  const itemType = String(form.get('itemType') ?? '').trim() || null
  const brand = String(form.get('brand') ?? '').trim() || null
  const priceRaw = String(form.get('price') ?? form.get('priceClass') ?? '').trim()
  const replaceAllPhotos = form.get('replaceAllPhotos') === '1'
  return { title, description, category, condition, kind, itemType, brand, priceRaw, replaceAllPhotos }
}

function collectPhotoFiles(form: FormData): { index: number; file: File }[] {
  const out: { index: number; file: File }[] = []
  for (let i = 0; i < GIDS_ZOEKERTJE_MAX_PHOTOS; i++) {
    const entry = form.get(`photo_${i}`)
    if (entry instanceof File && entry.size > 0) out.push({ index: i, file: entry })
  }
  return out
}

async function requireOwnerPremium(id: string) {
  const listingId = await getGidsOwnerListingIdFromCookies()
  if (!listingId) return { error: NextResponse.json({ error: 'Log in met je zaak.' }, { status: 401 }) }
  const row = await fetchListingRowByIdAdmin(listingId)
  if (!row || !resolveListingPremiumActive(row)) {
    return { error: NextResponse.json({ error: 'Premium vereist.' }, { status: 403 }) }
  }
  const ad = await fetchGidsZoekertjeByIdAdmin(id)
  if (!ad) return { error: NextResponse.json({ error: 'Zoekertje niet gevonden.' }, { status: 404 }) }
  if (ad.listingId !== listingId) {
    return { error: NextResponse.json({ error: 'Geen toegang.' }, { status: 403 }) }
  }
  return { listingId, ad }
}

export async function GET(_req: Request, ctx: RouteCtx) {
  const { id } = await ctx.params
  const ad = await fetchGidsZoekertjeByIdAdmin(id)
  if (!ad) return NextResponse.json({ error: 'Niet gevonden.' }, { status: 404 })

  const listingId = await getGidsOwnerListingIdFromCookies()
  if (!listingId || ad.listingId !== listingId) {
    return NextResponse.json({ zoekertje: ad })
  }
  return NextResponse.json({ zoekertje: ad, editable: true })
}

export async function PATCH(req: Request, ctx: RouteCtx) {
  const { id } = await ctx.params
  const auth = await requireOwnerPremium(id)
  if ('error' in auth) return auth.error
  const { listingId } = auth

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Ongeldig formulier.' }, { status: 400 })
  }

  const fields = parseSaveFields(form)
  if (!fields.title || !fields.description || !fields.category) {
    return NextResponse.json({ error: 'Titel, beschrijving en categorie zijn verplicht.' }, { status: 400 })
  }
  const priceStored = normalizeGidsZoekertjePriceInput(fields.priceRaw)
  if (!priceStored) {
    return NextResponse.json({ error: 'Voer een geldige prijs in (bijv. 250 of 250,50).' }, { status: 400 })
  }

  const updated = await updateGidsZoekertjeAdmin(id, listingId, {
    title: fields.title,
    description: fields.description,
    category: fields.category,
    condition: fields.condition,
    kind: fields.kind,
    itemType: fields.itemType,
    brand: fields.brand,
    price: priceStored,
  })
  if (!updated.ok) return NextResponse.json({ error: updated.error }, { status: 500 })

  const photos = collectPhotoFiles(form)
  if (fields.replaceAllPhotos) {
    await clearGidsZoekertjePhotosAdmin(id)
  }
  if (photos.length) {
    const admin = createGidsSupabaseAdmin()
    if (!admin) return NextResponse.json({ error: 'Database niet geconfigureerd.' }, { status: 503 })
    const bucketReady = await ensureGidsPhotosBucket(admin)
    if (!bucketReady.ok) return NextResponse.json({ error: bucketReady.message }, { status: 503 })
    const origin = siteOriginFromRequest(req)
    const uploaded = await replaceGidsZoekertjePhotosAdmin(id, photos, origin)
    if (!uploaded.ok) return NextResponse.json({ error: uploaded.error }, { status: 500 })
  }

  revalidatePath('/zoekertjes')
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, ctx: RouteCtx) {
  const { id } = await ctx.params
  const auth = await requireOwnerPremium(id)
  if ('error' in auth) return auth.error
  const { listingId } = auth

  const deleted = await deleteGidsZoekertjeAdmin(id, listingId)
  if (!deleted.ok) return NextResponse.json({ error: deleted.error }, { status: 500 })

  revalidatePath('/zoekertjes')
  return NextResponse.json({ ok: true })
}

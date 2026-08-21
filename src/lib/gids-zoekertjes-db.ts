import { createGidsSupabaseAdmin } from '@/lib/supabase-gids'
import { GIDS_LISTING_PHOTOS_BUCKET } from '@/lib/gids-listing-photos-server'
import { deleteGidsChatThreadsForZoekertjeAdmin } from '@/lib/gids-chat-db'
import type { GidsZoekertje, GidsZoekertjePhoto } from '@/lib/gids-zoekertjes-types'
import { friendlyGidsZoekertjesDbError, isMissingGidsZoekertjesTable } from '@/lib/gids-zoekertjes-db-errors'

export type FetchPublishedZoekertjesResult =
  | { zoekertjes: GidsZoekertje[]; setupRequired?: boolean }
  | null

type Row = {
  id: string
  listing_id: string
  title: string
  description: string
  category: string
  condition: string | null
  kind: string | null
  item_type: string | null
  brand: string | null
  price_class: string
  created_at: string
  gids_listings: { name: string; city: string; slug: string; province: string | null } | { name: string; city: string; slug: string; province: string | null }[] | null
}

type PhotoRow = {
  sort_order: number
  public_url: string
}

function listingJoin(row: Row): { name: string; city: string; slug: string; province: string } {
  const j = row.gids_listings
  const raw = Array.isArray(j) ? j[0] : j
  return {
    name: raw?.name ?? '—',
    city: raw?.city ?? '—',
    slug: raw?.slug ?? '',
    province: (raw?.province ?? '').trim(),
  }
}

function mapRow(row: Row, photos: PhotoRow[]): GidsZoekertje {
  const shop = listingJoin(row)
  return {
    id: row.id,
    listingId: row.listing_id,
    listingSlug: shop.slug,
    listingName: shop.name,
    listingCity: shop.city,
    listingProvince: shop.province,
    title: row.title,
    description: row.description,
    category: row.category,
    condition: row.condition,
    kind: row.kind,
    itemType: row.item_type,
    brand: row.brand,
    price: row.price_class,
    createdAt: row.created_at,
    photos: photos
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((p) => ({ sortOrder: p.sort_order, publicUrl: p.public_url })),
  }
}

export async function fetchPublishedGidsZoekertjesAdmin(): Promise<FetchPublishedZoekertjesResult> {
  const admin = createGidsSupabaseAdmin()
  if (!admin) return null

  const { data, error } = await admin
    .from('gids_zoekertjes')
    .select(
      'id, listing_id, title, description, category, condition, kind, item_type, brand, price_class, created_at, gids_listings(name, city, slug, province)',
    )
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('[gids zoekertjes list]', error.message)
    if (isMissingGidsZoekertjesTable(error.message)) {
      return { zoekertjes: [], setupRequired: true }
    }
    return null
  }

  const rows = (data ?? []) as Row[]
  if (rows.length === 0) return { zoekertjes: [] }

  const ids = rows.map((r) => r.id)
  const { data: photoRows } = await admin
    .from('gids_zoekertje_photos')
    .select('zoekertje_id, sort_order, public_url')
    .in('zoekertje_id', ids)
    .eq('sort_order', 0)

  const photosById = new Map<string, PhotoRow[]>()
  for (const p of photoRows ?? []) {
    const id = p.zoekertje_id as string
    photosById.set(id, [{ sort_order: p.sort_order as number, public_url: p.public_url as string }])
  }

  return { zoekertjes: rows.map((r) => mapRow(r, photosById.get(r.id) ?? [])) }
}

export async function countGidsZoekertjesByListingIdAdmin(listingId: string): Promise<number | null> {
  const admin = createGidsSupabaseAdmin()
  if (!admin) return null
  const { count, error } = await admin
    .from('gids_zoekertjes')
    .select('id', { count: 'exact', head: true })
    .eq('listing_id', listingId)
    .eq('status', 'published')
  if (error) {
    console.error('[gids zoekertjes count]', error.message)
    return null
  }
  return count ?? 0
}

/** Alle gepubliceerde zoekertjes van één zaak (beheer — geen site-brede limiet). */
export async function fetchGidsZoekertjesByListingIdAdmin(listingId: string): Promise<GidsZoekertje[] | null> {
  const admin = createGidsSupabaseAdmin()
  if (!admin) return null

  const { data, error } = await admin
    .from('gids_zoekertjes')
    .select(
      'id, listing_id, title, description, category, condition, kind, item_type, brand, price_class, created_at, gids_listings(name, city, slug, province)',
    )
    .eq('listing_id', listingId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[gids zoekertjes by listing]', error.message)
    if (isMissingGidsZoekertjesTable(error.message)) return []
    return null
  }

  const rows = (data ?? []) as Row[]
  if (rows.length === 0) return []

  const ids = rows.map((r) => r.id)
  const { data: photoRows } = await admin
    .from('gids_zoekertje_photos')
    .select('zoekertje_id, sort_order, public_url')
    .in('zoekertje_id', ids)

  const photosById = new Map<string, PhotoRow[]>()
  for (const p of photoRows ?? []) {
    const id = p.zoekertje_id as string
    const list = photosById.get(id) ?? []
    list.push({ sort_order: p.sort_order as number, public_url: p.public_url as string })
    photosById.set(id, list)
  }

  return rows.map((r) => mapRow(r, photosById.get(r.id) ?? []))
}

export async function fetchGidsZoekertjeByIdAdmin(id: string): Promise<GidsZoekertje | null> {
  const admin = createGidsSupabaseAdmin()
  if (!admin) return null

  const { data, error } = await admin
    .from('gids_zoekertjes')
    .select(
      'id, listing_id, title, description, category, condition, kind, item_type, brand, price_class, created_at, gids_listings(name, city, slug, province)',
    )
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return null

  const { data: photoRows } = await admin
    .from('gids_zoekertje_photos')
    .select('sort_order, public_url')
    .eq('zoekertje_id', id)
    .order('sort_order')

  return mapRow(data as Row, (photoRows ?? []) as PhotoRow[])
}

export type SaveZoekertjeInput = {
  title: string
  description: string
  category: string
  condition: string | null
  kind: string | null
  itemType: string | null
  brand: string | null
  price: string
}

export async function createGidsZoekertjeAdmin(
  listingId: string,
  input: SaveZoekertjeInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const admin = createGidsSupabaseAdmin()
  if (!admin) return { ok: false, error: 'Database niet geconfigureerd.' }

  const { data, error } = await admin
    .from('gids_zoekertjes')
    .insert({
      listing_id: listingId,
      title: input.title,
      description: input.description,
      category: input.category,
      condition: input.condition,
      kind: input.kind,
      item_type: input.itemType,
      brand: input.brand,
      price_class: input.price,
      status: 'published',
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error('[gids zoekertjes create]', error?.message)
    return { ok: false, error: friendlyGidsZoekertjesDbError(error?.message) }
  }
  return { ok: true, id: data.id as string }
}

export async function updateGidsZoekertjeAdmin(
  id: string,
  listingId: string,
  input: SaveZoekertjeInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createGidsSupabaseAdmin()
  if (!admin) return { ok: false, error: 'Database niet geconfigureerd.' }

  const { error } = await admin
    .from('gids_zoekertjes')
    .update({
      title: input.title,
      description: input.description,
      category: input.category,
      condition: input.condition,
      kind: input.kind,
      item_type: input.itemType,
      brand: input.brand,
      price_class: input.price,
    })
    .eq('id', id)
    .eq('listing_id', listingId)

  if (error) {
    console.error('[gids zoekertjes update]', error.message)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

export async function deleteGidsZoekertjeAdmin(
  id: string,
  listingId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createGidsSupabaseAdmin()
  if (!admin) return { ok: false, error: 'Database niet geconfigureerd.' }

  const { data: photos } = await admin
    .from('gids_zoekertje_photos')
    .select('storage_path')
    .eq('zoekertje_id', id)

  const paths = (photos ?? []).map((p) => p.storage_path as string).filter(Boolean)
  if (paths.length) {
    await admin.storage.from(GIDS_LISTING_PHOTOS_BUCKET).remove(paths)
  }

  const { error } = await admin.from('gids_zoekertjes').delete().eq('id', id).eq('listing_id', listingId)
  if (error) {
    console.error('[gids zoekertjes delete]', error.message)
    return { ok: false, error: error.message }
  }

  await deleteGidsChatThreadsForZoekertjeAdmin(id)

  return { ok: true }
}

export async function replaceGidsZoekertjePhotosAdmin(
  zoekertjeId: string,
  files: { index: number; file: File }[],
  origin: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createGidsSupabaseAdmin()
  if (!admin) return { ok: false, error: 'Database niet geconfigureerd.' }

  const { data: existing } = await admin
    .from('gids_zoekertje_photos')
    .select('sort_order, storage_path')
    .eq('zoekertje_id', zoekertjeId)

  const replaceIndexes = new Set(files.map((f) => f.index))
  const toRemove = (existing ?? [])
    .filter((e) => replaceIndexes.has(e.sort_order as number))
    .map((e) => e.storage_path as string)

  if (toRemove.length) {
    await admin.storage.from(GIDS_LISTING_PHOTOS_BUCKET).remove(toRemove)
    await admin.from('gids_zoekertje_photos').delete().eq('zoekertje_id', zoekertjeId).in('sort_order', [...replaceIndexes])
  }

  for (const { index, file } of files.sort((a, b) => a.index - b.index)) {
    const ext = file.type.includes('png') ? 'png' : file.type.includes('webp') ? 'webp' : 'jpg'
    const path = `zoekertjes/${zoekertjeId}/${index}-${Date.now().toString(36)}.${ext}`
    const buf = Buffer.from(await file.arrayBuffer())
    const { error: upErr } = await admin.storage.from(GIDS_LISTING_PHOTOS_BUCKET).upload(path, buf, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    })
    if (upErr) return { ok: false, error: upErr.message }

    const { data: pub } = admin.storage.from(GIDS_LISTING_PHOTOS_BUCKET).getPublicUrl(path)
    const publicUrlBase = pub.publicUrl.startsWith('http') ? pub.publicUrl : `${origin}${pub.publicUrl}`
    const publicUrl = `${publicUrlBase}${publicUrlBase.includes('?') ? '&' : '?'}v=${Date.now()}`

    const { error: insErr } = await admin.from('gids_zoekertje_photos').insert({
      zoekertje_id: zoekertjeId,
      sort_order: index,
      storage_path: path,
      public_url: publicUrl,
    })
    if (insErr) return { ok: false, error: insErr.message }
  }

  return { ok: true }
}

export async function clearGidsZoekertjePhotosAdmin(zoekertjeId: string): Promise<void> {
  const admin = createGidsSupabaseAdmin()
  if (!admin) return
  const { data: existing } = await admin
    .from('gids_zoekertje_photos')
    .select('storage_path')
    .eq('zoekertje_id', zoekertjeId)
  const paths = (existing ?? []).map((e) => e.storage_path as string)
  if (paths.length) await admin.storage.from(GIDS_LISTING_PHOTOS_BUCKET).remove(paths)
  await admin.from('gids_zoekertje_photos').delete().eq('zoekertje_id', zoekertjeId)
}

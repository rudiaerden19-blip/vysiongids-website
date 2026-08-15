import type { GidsMenuCatalog, GidsMenuCategory, GidsMenuProduct, GidsMenuSavePayload } from '@/lib/gids-menu-types'
import { sanitizeMenuImageUrl } from '@/lib/gids-menu-image-url'
import { createGidsSupabaseAdmin, createGidsSupabasePublic, isGidsSupabaseConfigured } from '@/lib/supabase-gids'

type CategoryRow = {
  id: string
  listing_id: string
  name: string
  sort_order: number
  is_active: boolean
}

type ProductRow = {
  id: string
  listing_id: string
  category_id: string
  name: string
  description: string | null
  price_eur: number | null
  image_url: string | null
  sort_order: number
  is_active: boolean
}

function mapProduct(row: ProductRow): GidsMenuProduct {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    description: row.description,
    priceEur: row.price_eur == null ? null : Number(row.price_eur),
    imageUrl: row.image_url,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  }
}

function buildCatalog(categories: CategoryRow[], products: ProductRow[]): GidsMenuCatalog {
  const byCategory = new Map<string, GidsMenuProduct[]>()
  for (const p of products.sort((a, b) => a.sort_order - b.sort_order)) {
    const list = byCategory.get(p.category_id) ?? []
    list.push(mapProduct(p))
    byCategory.set(p.category_id, list)
  }
  const out: GidsMenuCategory[] = categories
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c) => ({
      id: c.id,
      name: c.name,
      sortOrder: c.sort_order,
      isActive: c.is_active,
      products: byCategory.get(c.id) ?? [],
    }))
  return { categories: out }
}

export async function fetchGidsMenuCatalogByListingIdAdmin(listingId: string): Promise<GidsMenuCatalog> {
  const admin = createGidsSupabaseAdmin()
  if (!admin) return { categories: [] }

  const { data: categories } = await admin
    .from('gids_menu_categories')
    .select('*')
    .eq('listing_id', listingId)
    .order('sort_order')

  const { data: products } = await admin
    .from('gids_menu_products')
    .select('*')
    .eq('listing_id', listingId)
    .order('sort_order')

  return buildCatalog((categories as CategoryRow[]) ?? [], (products as ProductRow[]) ?? [])
}

export async function fetchGidsMenuCatalogBySlugPublic(slug: string): Promise<GidsMenuCatalog | null> {
  if (!isGidsSupabaseConfigured()) return null
  const supabase = createGidsSupabasePublic()
  if (!supabase) return null

  const { data: listing } = await supabase
    .from('gids_listings')
    .select('id, menu_catalog_active')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (!listing?.id || !listing.menu_catalog_active) return null

  const listingId = listing.id as string

  const { data: categories } = await supabase
    .from('gids_menu_categories')
    .select('*')
    .eq('listing_id', listingId)
    .eq('is_active', true)
    .order('sort_order')

  const { data: products } = await supabase
    .from('gids_menu_products')
    .select('*')
    .eq('listing_id', listingId)
    .eq('is_active', true)
    .order('sort_order')

  const catalog = buildCatalog((categories as CategoryRow[]) ?? [], (products as ProductRow[]) ?? [])
  const hasProducts = catalog.categories.some((c) => c.products.length > 0)
  return hasProducts ? catalog : null
}

export async function saveGidsMenuCatalog(listingId: string, payload: GidsMenuSavePayload): Promise<void> {
  const admin = createGidsSupabaseAdmin()
  if (!admin) throw new Error('Database niet geconfigureerd.')

  const incomingCategoryIds = new Set<string>()
  const incomingProductIds = new Set<string>()
  let activeProductCount = 0

  for (const cat of payload.categories) {
    if (!cat.name.trim()) continue
    incomingCategoryIds.add(cat.id)
    for (const p of cat.products) {
      if (!p.name.trim()) continue
      incomingProductIds.add(p.id)
      if (p.isActive) activeProductCount++
    }
  }

  const { data: existingCats } = await admin.from('gids_menu_categories').select('id').eq('listing_id', listingId)
  const { data: existingProds } = await admin.from('gids_menu_products').select('id').eq('listing_id', listingId)

  const toDeleteCatIds = (existingCats ?? []).map((r) => r.id as string).filter((id) => !incomingCategoryIds.has(id))
  const toDeleteProdIds = (existingProds ?? []).map((r) => r.id as string).filter((id) => !incomingProductIds.has(id))

  if (toDeleteProdIds.length) {
    await admin.from('gids_menu_products').delete().in('id', toDeleteProdIds)
  }
  if (toDeleteCatIds.length) {
    await admin.from('gids_menu_categories').delete().in('id', toDeleteCatIds)
  }

  for (let ci = 0; ci < payload.categories.length; ci++) {
    const cat = payload.categories[ci]!
    const name = cat.name.trim()
    if (!name) {
      throw new Error('Elke categorie moet een naam hebben (bv. Friet, Burgers).')
    }

    const catRow = {
      id: cat.id,
      listing_id: listingId,
      name,
      sort_order: cat.sortOrder ?? ci,
      is_active: cat.isActive !== false,
    }

    const { error: catErr } = await admin.from('gids_menu_categories').upsert(catRow, { onConflict: 'id' })
    if (catErr) throw new Error(catErr.message)

    for (let pi = 0; pi < cat.products.length; pi++) {
      const p = cat.products[pi]!
      const pName = p.name.trim()
      if (!pName) continue

      let price: number | null = null
      if (p.priceEur != null) {
        const n = Number(p.priceEur)
        if (!Number.isFinite(n) || n < 0) throw new Error(`Ongeldige prijs bij «${pName}».`)
        price = Math.round(n * 100) / 100
      }

      const prodRow = {
        id: p.id,
        listing_id: listingId,
        category_id: cat.id,
        name: pName,
        description: p.description?.trim() || null,
        price_eur: price,
        image_url: sanitizeMenuImageUrl(p.imageUrl),
        sort_order: p.sortOrder ?? pi,
        is_active: p.isActive !== false,
      }

      const { error: prodErr } = await admin.from('gids_menu_products').upsert(prodRow, { onConflict: 'id' })
      if (prodErr) throw new Error(prodErr.message)
    }
  }

  const { error: flagErr } = await admin
    .from('gids_listings')
    .update({ menu_catalog_active: activeProductCount > 0, updated_at: new Date().toISOString() })
    .eq('id', listingId)

  if (flagErr) throw new Error(flagErr.message)
}

export function countActiveMenuProducts(catalog: GidsMenuCatalog): number {
  let n = 0
  for (const c of catalog.categories) {
    for (const p of c.products) {
      if (p.isActive && p.name.trim()) n++
    }
  }
  return n
}

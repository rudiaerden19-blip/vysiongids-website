import { NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { getGidsOwnerListingIdFromCookies } from '@/lib/gids-session'
import { fetchGidsMenuCatalogByListingIdAdmin, saveGidsMenuCatalog } from '@/lib/gids-menu-db'
import type { GidsMenuSavePayload } from '@/lib/gids-menu-types'
import { fetchListingRowByIdAdmin } from '@/lib/gids-listings-db'
import { gidsListingSaveErrorMessage } from '@/lib/gids-listing-db-write'

export const maxDuration = 60

export async function GET() {
  const listingId = await getGidsOwnerListingIdFromCookies()
  if (!listingId) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const catalog = await fetchGidsMenuCatalogByListingIdAdmin(listingId)
  return NextResponse.json({ catalog })
}

export async function PUT(req: Request) {
  const listingId = await getGidsOwnerListingIdFromCookies()
  if (!listingId) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  let body: GidsMenuSavePayload
  try {
    body = (await req.json()) as GidsMenuSavePayload
  } catch {
    return NextResponse.json({ error: 'Ongeldige data.' }, { status: 400 })
  }

  if (!body?.categories || !Array.isArray(body.categories)) {
    return NextResponse.json({ error: 'Menu ontbreekt.' }, { status: 400 })
  }

  try {
    await saveGidsMenuCatalog(listingId, body)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Opslaan mislukt'
    return NextResponse.json({ error: gidsListingSaveErrorMessage(message) || message }, { status: 500 })
  }

  const row = await fetchListingRowByIdAdmin(listingId)
  const slug = row?.slug

  revalidateTag('gids-listings', 'max')
  if (slug) {
    revalidatePath(`/zaak/${slug}`)
    revalidatePath(`/zaak/${slug}/menu`)
  }

  return NextResponse.json({ ok: true, slug })
}

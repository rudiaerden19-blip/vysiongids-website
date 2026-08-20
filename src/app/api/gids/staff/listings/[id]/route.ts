import { NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { isGidsStaffAuthenticated } from '@/lib/gids-staff-session'
import {
  applyGidsStaffListingActionAdmin,
  setGidsListingPausedAdmin,
  fetchGidsListingSlugByIdAdmin,
  type StaffListingAction,
} from '@/lib/gids-staff-listings-db'
import { deleteGidsListingByIdAdmin } from '@/lib/gids-listing-delete-admin'

type PatchBody = {
  action?: StaffListingAction | 'hide_listing' | 'show_listing'
}

function revalidateListing(slug?: string) {
  revalidateTag('gids-listings', 'max')
  revalidatePath('/')
  if (slug) {
    revalidatePath(`/zaak/${slug}`)
    revalidatePath(`/zaak/${slug}/reviews`)
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isGidsStaffAuthenticated())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id } = await ctx.params
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 })

  let body: PatchBody
  try {
    body = (await req.json()) as PatchBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const action = body.action
  if (action === 'hide_listing' || action === 'show_listing') {
    const r = await setGidsListingPausedAdmin(id, action === 'hide_listing')
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 500 })
    const slug = await fetchGidsListingSlugByIdAdmin(id)
    revalidateListing(slug)
    return NextResponse.json({ ok: true })
  }

  if (action !== 'mark_paid' && action !== 'pause' && action !== 'resume' && action !== 'revoke_premium') {
    return NextResponse.json({ error: 'invalid_action' }, { status: 400 })
  }

  const result = await applyGidsStaffListingActionAdmin(id, action)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 })

  revalidateListing(result.row.slug)
  return NextResponse.json({ ok: true, listing: result.row })
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isGidsStaffAuthenticated())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id } = await ctx.params
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 })

  const slug = await fetchGidsListingSlugByIdAdmin(id)
  const deleted = await deleteGidsListingByIdAdmin(id)
  if (!deleted.ok) return NextResponse.json({ error: deleted.error }, { status: 500 })

  revalidateListing(slug)
  return NextResponse.json({ ok: true })
}

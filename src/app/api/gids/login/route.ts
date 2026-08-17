import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { verifyGidsPin } from '@/lib/gids-pin'
import { fetchListingByLoginNameAdmin } from '@/lib/gids-listings-db'
import {
  GIDS_SESSION_COOKIE,
  gidsSessionCookieOptions,
  signGidsSession,
} from '@/lib/gids-session'

export async function POST(req: Request) {
  let body: { name?: string; pin?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag.' }, { status: 400 })
  }

  const name = String(body.name ?? '').trim()
  const pin = String(body.pin ?? '').trim()
  if (!name || !pin) {
    return NextResponse.json({ error: 'Vul zaaknaam en PIN in.' }, { status: 400 })
  }

  const row = await fetchListingByLoginNameAdmin(name)
  if (!row || !row.pin_hash) {
    return NextResponse.json({ error: 'Onbekende zaak of verkeerde PIN.' }, { status: 401 })
  }

  if (!verifyGidsPin(pin, row.pin_hash)) {
    return NextResponse.json({ error: 'Onbekende zaak of verkeerde PIN.' }, { status: 401 })
  }

  const token = signGidsSession(row.id)
  if (!token) {
    return NextResponse.json(
      {
        error:
          'Sessie niet beschikbaar (zet VYSIONGIDS_SESSION_SECRET in Vercel of controleer VYSIONGIDS_SUPABASE_SERVICE_ROLE_KEY).',
      },
      { status: 503 },
    )
  }

  const res = NextResponse.json({ ok: true, slug: row.slug, name: row.name })
  res.cookies.set(GIDS_SESSION_COOKIE, token, gidsSessionCookieOptions())
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(GIDS_SESSION_COOKIE, '', { ...gidsSessionCookieOptions(0), maxAge: 0 })
  return res
}

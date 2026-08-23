import { NextResponse } from 'next/server'
import { verifyGidsPin } from '@/lib/gids-pin'
import { fetchListingByLoginNameAdmin } from '@/lib/gids-listings-db'
import { enforceRateLimit } from '@/lib/gids-rate-limit'
import {
  GIDS_SESSION_COOKIE,
  gidsSessionCookieOptions,
  signGidsSession,
} from '@/lib/gids-session'

const LOGIN_WINDOW_MS = 15 * 60 * 1000
const LOGIN_MAX_PER_IP = 20

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, 'gids-owner-login', LOGIN_WINDOW_MS, LOGIN_MAX_PER_IP)
  if (limited) return limited

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
  const pinOk = row?.pin_hash ? verifyGidsPin(pin, row.pin_hash) : false
  if (!row || !pinOk) {
    return NextResponse.json(
      {
        error:
          'Zaaknaam of PIN is onjuist. Gebruik de exacte naam zoals in de gids en de 6 cijfers die je koos bij «Zaak toevoegen».',
      },
      { status: 401 },
    )
  }

  const token = signGidsSession(row.id)
  if (!token) {
    return NextResponse.json({ error: 'Inloggen tijdelijk niet beschikbaar. Probeer later opnieuw.' }, { status: 503 })
  }

  const res = NextResponse.json({
    ok: true,
    slug: row.slug,
    name: row.name,
    mustChangePin: row.pin_must_change === true,
  })
  res.cookies.set(GIDS_SESSION_COOKIE, token, gidsSessionCookieOptions())
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(GIDS_SESSION_COOKIE, '', { ...gidsSessionCookieOptions(0), maxAge: 0 })
  return res
}

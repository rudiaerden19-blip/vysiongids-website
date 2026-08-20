import { NextResponse } from 'next/server'
import {
  GIDS_STAFF_COOKIE,
  gidsStaffSessionCookieOptions,
  isGidsStaffAuthenticated,
  isGidsStaffPasswordConfigured,
  signGidsStaffSessionToken,
  verifyGidsStaffPassword,
} from '@/lib/gids-staff-session'
import { isGidsSessionConfigured } from '@/lib/gids-session'
import { enforceRateLimit } from '@/lib/gids-rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const STAFF_LOGIN_WINDOW_MS = 15 * 60 * 1000
const STAFF_LOGIN_MAX_PER_IP = 15

export async function GET() {
  const authenticated = await isGidsStaffAuthenticated()
  return NextResponse.json({
    authenticated,
    configured: isGidsStaffPasswordConfigured() && isGidsSessionConfigured(),
  })
}

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, 'gids-staff-login', STAFF_LOGIN_WINDOW_MS, STAFF_LOGIN_MAX_PER_IP)
  if (limited) return limited

  if (!isGidsStaffPasswordConfigured() || !isGidsSessionConfigured()) {
    return NextResponse.json({ error: 'Medewerkerslogin niet geconfigureerd.' }, { status: 503 })
  }

  let password = ''
  try {
    const body = (await req.json()) as { password?: string }
    password = typeof body.password === 'string' ? body.password : ''
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag.' }, { status: 400 })
  }

  if (!verifyGidsStaffPassword(password)) {
    return NextResponse.json({ error: 'Onjuiste toegangscode.' }, { status: 401 })
  }

  const token = signGidsStaffSessionToken()
  if (!token) {
    return NextResponse.json({ error: 'Sessie niet beschikbaar.' }, { status: 503 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(GIDS_STAFF_COOKIE, token, gidsStaffSessionCookieOptions())
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(GIDS_STAFF_COOKIE, '', { maxAge: 0, path: '/', httpOnly: true, sameSite: 'lax' })
  return res
}

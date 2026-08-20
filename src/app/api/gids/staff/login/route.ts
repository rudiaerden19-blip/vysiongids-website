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

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const authenticated = await isGidsStaffAuthenticated()
  return NextResponse.json({
    authenticated,
    configured: isGidsStaffPasswordConfigured() && isGidsSessionConfigured(),
  })
}

export async function POST(req: Request) {
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
    return NextResponse.json({ error: 'Onjuist wachtwoord.' }, { status: 401 })
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

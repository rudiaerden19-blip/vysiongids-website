import { createHash, createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const GIDS_SESSION_COOKIE = 'gids_owner_session'

/** Na deze inactiviteit opnieuw inloggen (standaard 5 min). */
export const GIDS_SESSION_IDLE_SECONDS = (() => {
  const raw = process.env.GIDS_SESSION_IDLE_MINUTES?.trim()
  const min = raw ? Number(raw) : 5
  if (!Number.isFinite(min) || min < 1) return 5 * 60
  return Math.min(Math.floor(min * 60), 24 * 60 * 60)
})()

/** Maximale sessieduur zelfs bij activiteit (7 dagen). */
export const GIDS_SESSION_ABSOLUTE_MAX_SECONDS = 60 * 60 * 24 * 7

/** Expliciete secret in Vercel, of afgeleid van service role (zelfde project, server-only). */
export function resolveGidsSessionSecret(): string | null {
  const explicit =
    process.env.VYSIONGIDS_SESSION_SECRET?.trim() || process.env.GIDS_SESSION_SECRET?.trim()
  if (explicit && explicit.length >= 16) return explicit

  const service = process.env.VYSIONGIDS_SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (service && service.length >= 32) {
    return createHash('sha256').update(`vysiongids-owner-session:v1:${service}`).digest('base64')
  }

  return null
}

export function isGidsSessionConfigured(): boolean {
  return resolveGidsSessionSecret() != null
}

function sessionSecret(): string | null {
  return resolveGidsSessionSecret()
}

function nowUnix(): number {
  return Math.floor(Date.now() / 1000)
}

function signPayload(payload: string): string | null {
  const secret = sessionSecret()
  if (!secret) return null
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

function verifySig(payload: string, sig: string): boolean {
  const expected = signPayload(payload)
  if (!expected) return false
  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false
    return true
  } catch {
    return false
  }
}

export type VerifiedGidsSession = {
  listingId: string
  iat: number
  lat: number
  legacy: boolean
}

/** v2: `{uuid}.{iat}.{lat}.{sig}` — sliding idle + max leeftijd. */
export function verifyGidsSessionTokenDetailed(token: string): VerifiedGidsSession | null {
  const parts = token.split('.')
  if (parts.length === 2) {
    return null
  }
  if (parts.length !== 4) return null

  const [listingId, iatRaw, latRaw, sig] = parts
  if (!listingId || !iatRaw || !latRaw || !sig) return null
  const iat = Number(iatRaw)
  const lat = Number(latRaw)
  if (!Number.isFinite(iat) || !Number.isFinite(lat)) return null

  const payload = `${listingId}.${iatRaw}.${latRaw}`
  if (!verifySig(payload, sig)) return null

  const now = nowUnix()
  if (now - lat > GIDS_SESSION_IDLE_SECONDS) return null
  if (now - iat > GIDS_SESSION_ABSOLUTE_MAX_SECONDS) return null

  return { listingId, iat, lat, legacy: false }
}

/** Backwards-compatible listing id lookup. */
export function verifyGidsSessionToken(token: string): string | null {
  return verifyGidsSessionTokenDetailed(token)?.listingId ?? null
}

export function createGidsSessionToken(listingId: string, iat?: number, lat?: number): string | null {
  const t = nowUnix()
  const issued = iat ?? t
  const last = lat ?? t
  const payload = `${listingId}.${issued}.${last}`
  const sig = signPayload(payload)
  if (!sig) return null
  return `${payload}.${sig}`
}

export function refreshGidsSessionToken(session: VerifiedGidsSession): string | null {
  const now = nowUnix()
  const iat = session.legacy ? now : session.iat
  if (now - iat > GIDS_SESSION_ABSOLUTE_MAX_SECONDS) return null
  return createGidsSessionToken(session.listingId, iat, now)
}

export function gidsSessionCookieOptions(maxAgeSeconds = GIDS_SESSION_ABSOLUTE_MAX_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  }
}

export function signGidsSession(listingId: string): string | null {
  return createGidsSessionToken(listingId)
}

export async function readGidsOwnerSession(): Promise<VerifiedGidsSession | null> {
  const jar = await cookies()
  const raw = jar.get(GIDS_SESSION_COOKIE)?.value
  if (!raw) return null
  return verifyGidsSessionTokenDetailed(raw)
}

export async function getGidsOwnerListingIdFromCookies(): Promise<string | null> {
  const session = await readGidsOwnerSession()
  return session?.listingId ?? null
}

/** API-routes: sessie verlengen op de response (niet in Server Components). */
export function applyOwnerSessionRefresh(
  res: NextResponse,
  session: VerifiedGidsSession | null | undefined,
): NextResponse {
  if (session) setRefreshedGidsSessionCookie(res, session)
  return res
}

export function setRefreshedGidsSessionCookie(
  res: { cookies: { set: (name: string, value: string, options: object) => void } },
  session: VerifiedGidsSession,
): void {
  const refreshed = refreshGidsSessionToken(session)
  if (!refreshed) return
  res.cookies.set(GIDS_SESSION_COOKIE, refreshed, gidsSessionCookieOptions())
}

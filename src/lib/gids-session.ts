import { createHash, createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

export const GIDS_SESSION_COOKIE = 'gids_owner_session'

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

export function signGidsSession(listingId: string): string | null {
  const secret = sessionSecret()
  if (!secret) return null
  const sig = createHmac('sha256', secret).update(listingId).digest('base64url')
  return `${listingId}.${sig}`
}

export function verifyGidsSessionToken(token: string): string | null {
  const secret = sessionSecret()
  if (!secret) return null
  const dot = token.lastIndexOf('.')
  if (dot <= 0) return null
  const listingId = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = createHmac('sha256', secret).update(listingId).digest('base64url')
  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  } catch {
    return null
  }
  return listingId
}

export async function getGidsOwnerListingIdFromCookies(): Promise<string | null> {
  const jar = await cookies()
  const raw = jar.get(GIDS_SESSION_COOKIE)?.value
  if (!raw) return null
  return verifyGidsSessionToken(raw)
}

export function gidsSessionCookieOptions(maxAgeSeconds = 60 * 60 * 24 * 30) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  }
}

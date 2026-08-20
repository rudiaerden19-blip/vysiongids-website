import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { gidsSessionCookieOptions, resolveGidsSessionSecret } from '@/lib/gids-session'

export const GIDS_STAFF_COOKIE = 'gids_staff_session'

const STAFF_PAYLOAD = 'vysiongids-staff:v1'

export function isGidsStaffPasswordConfigured(): boolean {
  return Boolean(process.env.VYSIONGIDS_STAFF_PASSWORD?.trim())
}

export function verifyGidsStaffPassword(password: string): boolean {
  const expected = process.env.VYSIONGIDS_STAFF_PASSWORD?.trim()
  const given = password.trim()
  if (!expected || !given) return false
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  try {
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export function signGidsStaffSessionToken(): string | null {
  const secret = resolveGidsSessionSecret()
  if (!secret) return null
  const sig = createHmac('sha256', secret).update(STAFF_PAYLOAD).digest('base64url')
  return `${STAFF_PAYLOAD}.${sig}`
}

export function verifyGidsStaffSessionToken(token: string): boolean {
  const secret = resolveGidsSessionSecret()
  if (!secret) return false
  const dot = token.lastIndexOf('.')
  if (dot <= 0) return false
  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  if (payload !== STAFF_PAYLOAD) return false
  const expected = createHmac('sha256', secret).update(STAFF_PAYLOAD).digest('base64url')
  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false
  } catch {
    return false
  }
  return true
}

export async function isGidsStaffAuthenticated(): Promise<boolean> {
  const jar = await cookies()
  const raw = jar.get(GIDS_STAFF_COOKIE)?.value
  if (!raw) return false
  return verifyGidsStaffSessionToken(raw)
}

export function gidsStaffSessionCookieOptions() {
  return gidsSessionCookieOptions(60 * 60 * 8)
}

import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

const KEY_LEN = 32

export function isValidGidsPin(pin: string): boolean {
  return /^\d{6}$/.test(pin)
}

export function hashGidsPin(pin: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(pin, salt, KEY_LEN).toString('hex')
  return `scrypt:${salt}:${hash}`
}

export function verifyGidsPin(pin: string, stored: string): boolean {
  if (!isValidGidsPin(pin)) return false
  const parts = stored.split(':')
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false
  const [, salt, expectedHex] = parts
  const hash = scryptSync(pin, salt, KEY_LEN)
  const expected = Buffer.from(expectedHex, 'hex')
  if (expected.length !== hash.length) return false
  return timingSafeEqual(hash, expected)
}

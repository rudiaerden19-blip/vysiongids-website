import { NextResponse } from 'next/server'

type Bucket = { count: number; resetAt: number }

/** Per serverless instance — combineert met lage limieten tegen misbruik. */
const buckets = new Map<string, Bucket>()

export function clientIpFromRequest(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) {
    const first = xff.split(',')[0]?.trim()
    if (first) return first
  }
  const real = req.headers.get('x-real-ip')?.trim()
  if (real) return real
  return 'unknown'
}

export function consumeRateLimit(
  key: string,
  opts: { windowMs: number; max: number },
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now()
  let bucket = buckets.get(key)
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + opts.windowMs }
    buckets.set(key, bucket)
  }
  if (bucket.count >= opts.max) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) }
  }
  bucket.count += 1
  return { ok: true }
}

export function rateLimitResponse(retryAfterSec: number): NextResponse {
  return NextResponse.json(
    { error: 'Te veel verzoeken. Probeer later opnieuw.' },
    { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
  )
}

/** `null` = doorgaan; anders 429-response. */
export function enforceRateLimit(
  req: Request,
  namespace: string,
  windowMs: number,
  max: number,
): NextResponse | null {
  const ip = clientIpFromRequest(req)
  const result = consumeRateLimit(`${namespace}:${ip}`, { windowMs, max })
  if (!result.ok) return rateLimitResponse(result.retryAfterSec)
  return null
}

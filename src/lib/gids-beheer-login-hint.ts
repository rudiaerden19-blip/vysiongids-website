const KEY = 'gids-beheer-login-hint'
const MAX_AGE_MS = 120_000

export type GidsBeheerLoginHint = { slug: string; name: string; ts: number }

export function storeGidsBeheerLoginHint(slug: string, name: string): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ slug, name, ts: Date.now() } satisfies GidsBeheerLoginHint))
  } catch {
    /* quota / private mode */
  }
}

export function readGidsBeheerLoginHint(): GidsBeheerLoginHint | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as GidsBeheerLoginHint
    if (!parsed?.slug || !parsed?.name || !parsed?.ts) return null
    if (Date.now() - parsed.ts > MAX_AGE_MS) {
      sessionStorage.removeItem(KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function clearGidsBeheerLoginHint(): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

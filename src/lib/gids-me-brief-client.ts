/** Eén gedeelde /api/gids/me?brief=1 per tab — voorkomt N requests op diensten-grid. */

type BriefMe = {
  authenticated?: boolean
  slug?: string
}

let cached: BriefMe | null = null
let cachedAt = 0
let inflight: Promise<BriefMe> | null = null

const TTL_MS = 90_000

export function fetchGidsMeBriefCached(): Promise<BriefMe> {
  const now = Date.now()
  if (cached && now - cachedAt < TTL_MS) {
    return Promise.resolve(cached)
  }
  if (inflight) return inflight

  inflight = fetch('/api/gids/me?brief=1', { credentials: 'same-origin' })
    .then(async (r) => {
      const data = (await r.json()) as BriefMe
      cached = data
      cachedAt = Date.now()
      return data
    })
    .catch(() => {
      return cached ?? { authenticated: false }
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}

export function invalidateGidsMeBriefCache(): void {
  cached = null
  cachedAt = 0
}

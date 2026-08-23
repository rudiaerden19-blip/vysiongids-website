const DEFAULT_SITE = 'https://www.vysiongids.be'

/** Canonieke origin voor sitemap, OG en JSON-LD (productie-URL). */
export function gidsCanonicalSiteOrigin(): string {
  return process.env.NEXT_PUBLIC_VYSIONGIDS_SITE_URL?.replace(/\/$/, '') ?? DEFAULT_SITE
}

function allowedHosts(): Set<string> {
  const raw =
    process.env.VYSIONGIDS_ALLOWED_HOSTS?.trim() ||
    'www.vysiongids.be,vysiongids.be,localhost:3000,127.0.0.1:3000'
  return new Set(
    raw
      .split(',')
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean),
  )
}

function hostAllowed(host: string): boolean {
  const h = host.split(':')[0]?.toLowerCase() ?? ''
  const full = host.toLowerCase()
  const allowed = allowedHosts()
  return allowed.has(full) || allowed.has(h)
}

/** Veilige origin voor Stripe-redirects en public URLs (geen willekeurige Host-header). */
export function siteOriginFromRequest(req: Request): string {
  const envFallback =
    process.env.NEXT_PUBLIC_VYSIONGIDS_SITE_URL?.replace(/\/$/, '') ?? DEFAULT_SITE

  const hostHeader = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  if (!hostHeader) return envFallback

  const host = hostHeader.split(',')[0]?.trim()
  if (!host || !hostAllowed(host)) return envFallback

  const proto = (req.headers.get('x-forwarded-proto') ?? 'https').split(',')[0]?.trim() || 'https'
  return `${proto}://${host}`
}

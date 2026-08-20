/** Publieke zaak-URL (zelfde host als productie of huidige site). */
export function gidsListingPublicPath(slug: string): string {
  const s = slug.trim()
  return `/zaak/${encodeURIComponent(s)}`
}

export function gidsListingPublicUrl(slug: string, origin?: string): string {
  const base =
    origin?.replace(/\/$/, '') ??
    (typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_VYSIONGIDS_SITE_URL?.replace(/\/$/, '') ?? 'https://www.vysiongids.be')
  return `${base}${gidsListingPublicPath(slug)}`
}

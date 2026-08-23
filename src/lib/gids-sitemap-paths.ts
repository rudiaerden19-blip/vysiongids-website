import type { MetadataRoute } from 'next'
import { gidsCanonicalSiteOrigin } from '@/lib/gids-site-origin'

export type GidsStaticSitemapEntry = {
  path: string
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
  priority: number
}

/** Publieke marketing- en browse-pagina’s (geen login/beheer). */
export const GIDS_STATIC_SITEMAP_ENTRIES: GidsStaticSitemapEntry[] = [
  { path: '/', changeFrequency: 'daily', priority: 1 },
  { path: '/zoeken', changeFrequency: 'daily', priority: 0.9 },
  { path: '/zoekertjes', changeFrequency: 'daily', priority: 0.75 },
  { path: '/jobs', changeFrequency: 'daily', priority: 0.75 },
  { path: '/diensten', changeFrequency: 'weekly', priority: 0.85 },
  { path: '/diensten/aanmelden', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/zaak-toevoegen', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/sterrenzaken', changeFrequency: 'weekly', priority: 0.55 },
  { path: '/cadeaubonnen', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/leveranciers', changeFrequency: 'monthly', priority: 0.45 },
]

export function gidsSitemapAbsoluteUrl(path: string): string {
  const base = gidsCanonicalSiteOrigin()
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

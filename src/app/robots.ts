import type { MetadataRoute } from 'next'
import { gidsCanonicalSiteOrigin } from '@/lib/gids-site-origin'

export default function robots(): MetadataRoute.Robots {
  const origin = gidsCanonicalSiteOrigin()
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/beheer', '/login', '/intern/'],
    },
    sitemap: `${origin}/sitemap.xml`,
    host: origin.replace(/^https?:\/\//, '').replace(/\/$/, ''),
  }
}

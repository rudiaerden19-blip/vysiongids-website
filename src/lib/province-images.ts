import { BELGIUM_PROVINCES } from '@/lib/belgium-locations'

/** Optionele kaartfoto per provincie (public/images/provinces). */
export const PROVINCE_IMAGE: Partial<Record<(typeof BELGIUM_PROVINCES)[number]['slug'], string>> = {
  antwerpen: '/images/provinces/antwerpen.png',
  brussel: '/images/provinces/brussel.png',
  henegouwen: '/images/provinces/henegouwen.png',
  limburg: '/images/provinces/limburg.png',
  luik: '/images/provinces/luik.png',
  'oost-vlaanderen': '/images/provinces/oost-vlaanderen.png',
  'west-vlaanderen': '/images/provinces/west-vlaanderen.png',
}

export function provinceImageUrl(slug: string): string | null {
  return PROVINCE_IMAGE[slug as keyof typeof PROVINCE_IMAGE] ?? null
}

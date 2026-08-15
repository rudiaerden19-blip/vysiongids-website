import { BELGIUM_PROVINCES } from '@/lib/belgium-locations'

/** Optionele kaartfoto per provincie (public/images/provinces). */
export const PROVINCE_IMAGE: Partial<Record<(typeof BELGIUM_PROVINCES)[number]['slug'], string>> = {
  antwerpen: '/images/provinces/antwerpen.png',
  brussel: '/images/provinces/brussel.png',
  henegouwen: '/images/provinces/henegouwen.png',
  limburg: '/images/provinces/limburg.png',
  luik: '/images/provinces/luik.png',
  luxemburg: '/images/provinces/luxemburg.png',
  namen: '/images/provinces/namen.png',
  'oost-vlaanderen': '/images/provinces/oost-vlaanderen.png',
  'vlaams-brabant': '/images/provinces/vlaams-brabant.png',
  'waals-brabant': '/images/provinces/waals-brabant.png',
  'west-vlaanderen': '/images/provinces/west-vlaanderen.png',
}

export function provinceImageUrl(slug: string): string | null {
  return PROVINCE_IMAGE[slug as keyof typeof PROVINCE_IMAGE] ?? null
}

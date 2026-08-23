'use client'

import VerwijderZaakButton from '@/components/VerwijderZaakButton'
import { useLanguage } from '@/i18n/LanguageProvider'
import { useGidsOwnerSlug } from '@/lib/use-gids-owner-slug'

type Props = { slug: string }

/** Alleen zichtbaar voor ingelogde zaakhouder van deze slug — niet voor bezoekers. */
export default function ZaakOwnerDeleteSection({ slug }: Props) {
  const { t } = useLanguage()
  const { ownerSlug, authChecked } = useGidsOwnerSlug()

  if (!authChecked || ownerSlug !== slug) return null

  return (
    <section className="mt-10 rounded-xl border border-red-200 bg-red-50/50 p-5">
      <h2 className="text-base font-bold text-gray-900">{t('beheer.deleteSectionTitle')}</h2>
      <p className="mt-1 text-sm text-gray-600">{t('beheer.deleteSectionLead')}</p>
      <VerwijderZaakButton expectedSlug={slug} className="mt-4" />
    </section>
  )
}

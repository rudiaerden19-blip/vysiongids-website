'use client'

import { useLanguage } from '@/i18n/LanguageProvider'
import { LISTING_TYPES } from '@/lib/listing-types'
import { listingAllHorecaTypes, type HorecaListingTypeId } from '@/lib/listing-horeca-types'
import type { Listing } from '@/lib/listing-types'

const HORECA_TYPES = LISTING_TYPES.filter((t) => t.id !== 'all')

type Props = {
  idPrefix?: string
  listing?: Pick<Listing, 'type' | 'horecaTypes'>
  disabled?: boolean
}

export default function HorecaTypesCheckboxGroup({ idPrefix = '', listing, disabled }: Props) {
  const { t } = useLanguage()
  const selected = new Set(listing ? listingAllHorecaTypes(listing) : [])
  const prefix = idPrefix ? `${idPrefix}-` : ''

  return (
    <fieldset className="mt-1 space-y-2" disabled={disabled}>
      <legend className="sr-only">{t('beheer.editForm.horecaTypesLabel')}</legend>
      <ul className="grid gap-2 sm:grid-cols-2">
        {HORECA_TYPES.map((row) => {
          const id = `${prefix}horeca-type-${row.id}` as const
          const checked = selected.has(row.id as HorecaListingTypeId)
          return (
            <li key={row.id}>
              <label
                htmlFor={id}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 has-[:checked]:border-[var(--accent)] has-[:checked]:bg-sky-50/80"
              >
                <input
                  id={id}
                  type="checkbox"
                  name="horecaTypes"
                  value={row.id}
                  defaultChecked={checked}
                  className="h-4 w-4 shrink-0 accent-[var(--accent)]"
                />
                {t(`search.types.${row.id}`)}
              </label>
            </li>
          )
        })}
      </ul>
      <p className="text-xs text-gray-500">{t('beheer.editForm.horecaTypesHint')}</p>
    </fieldset>
  )
}

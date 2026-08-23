'use client'

import { useLanguage } from '@/i18n/LanguageProvider'
import {
  localizedDeliveryFeeLabel,
  localizedMinOrder,
} from '@/lib/listing-i18n'
import type { Listing } from '@/lib/listing-types'
import { formatDeliveryRadiusKm } from '@/lib/listing-delivery-radius'

export default function ZaakOrderDetailsSection({ listing }: { listing: Listing }) {
  const { t } = useLanguage()
  const deliveryFeeLabel = localizedDeliveryFeeLabel(t, listing)
  const minOrder = localizedMinOrder(t, listing)
  const radiusKm = formatDeliveryRadiusKm(listing.deliveryRadiusKm)

  return (
    <section className="vysiongids-zaak-panel mt-8 bg-white p-4 sm:p-5">
      <h2 className="text-lg font-bold text-gray-900">{t('listing.orderSectionTitle')}</h2>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        {listing.pickupTimeMin != null && listing.pickupTimeMax != null ? (
          <div>
            <dt className="font-semibold text-gray-500">{t('listing.pickupTime')}</dt>
            <dd>
              {listing.pickupTimeMin}–{listing.pickupTimeMax} {t('listing.minutesSuffix')}
            </dd>
          </div>
        ) : null}
        {listing.deliveryTimeMin != null && listing.deliveryTimeMax != null ? (
          <div>
            <dt className="font-semibold text-gray-500">{t('listing.deliveryTime')}</dt>
            <dd>
              {listing.deliveryTimeMin}–{listing.deliveryTimeMax} {t('listing.minutesSuffix')}
            </dd>
          </div>
        ) : null}
        {deliveryFeeLabel ? (
          <div>
            <dt className="font-semibold text-gray-500">{t('listing.deliveryFee')}</dt>
            <dd>{deliveryFeeLabel}</dd>
          </div>
        ) : null}
        {minOrder ? (
          <div>
            <dt className="font-semibold text-gray-500">{t('listing.minimumOrder')}</dt>
            <dd>{minOrder}</dd>
          </div>
        ) : null}
        {radiusKm ? (
          <div>
            <dt className="font-semibold text-gray-500">{t('listing.deliveryRadius')}</dt>
            <dd>{radiusKm}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  )
}

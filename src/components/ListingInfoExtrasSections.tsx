'use client'

import { useLanguage } from '@/i18n/LanguageProvider'
import ListingPromotionOffersList from '@/components/ListingPromotionOffersList'
import { belgiumPhoneTelHref } from '@/lib/belgium-phone'
import { listingHasInfoExtras } from '@/lib/listing-info-extras'
import { listingPanelPromotionActive } from '@/lib/listing-panel-promotion'
import { hiringJobTypeLabels } from '@/lib/listing-hiring'
import type { Listing } from '@/lib/listing-types'

type Props = {
  listing: Listing
}

export default function ListingInfoExtrasSections({ listing }: Props) {
  const { t } = useLanguage()
  const extras = listing.infoExtras
  if (!listingHasInfoExtras(extras)) return null

  const specialties = extras?.specialties?.filter((s) => s.caption || s.imageUrl) ?? []
  const hiring = extras?.hiring?.enabled ? extras.hiring : null
  const hiringTypeLabels = hiring ? hiringJobTypeLabels(hiring.jobTypes) : []
  const gift = extras?.giftCard?.enabled ? extras.giftCard : null
  const promotion = listingPanelPromotionActive(extras)
  const giftValue =
    gift?.valueEur != null && Number.isFinite(gift.valueEur)
      ? `€${gift.valueEur.toFixed(0)}`
      : null

  const hiringTitle =
    hiring?.title?.trim() ||
    (hiringTypeLabels.length
      ? `${hiringTypeLabels.join(' · ')}${t('listing.infoExtras.hiringSoughtSuffix')}`
      : t('listing.infoExtras.hiringDefaultTitle'))

  return (
    <div className="vysiongids-zaak-info-extras">
      {specialties.length > 0 ? (
        <section className="vysiongids-info-block vysiongids-info-block--specialties">
          <p className="vysiongids-info-kicker">{t('listing.infoExtras.kitchenKicker')}</p>
          <h2 className="vysiongids-info-title">{t('listing.infoExtras.specialtiesTitle')}</h2>
          <ul className="vysiongids-specialties-grid">
            {specialties.map((item, i) => (
              <li key={i} className="vysiongids-specialty-card">
                <div className="vysiongids-specialty-card-media">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" className="vysiongids-specialty-card-img" />
                  ) : (
                    <div className="vysiongids-specialty-card-placeholder" aria-hidden />
                  )}
                  {item.caption ? <p className="vysiongids-specialty-card-caption">{item.caption}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {hiring ? (
        <section id="vacature" className="vysiongids-info-block vysiongids-info-block--hiring">
          <p className="vysiongids-info-kicker">{t('listing.infoExtras.hiringKicker')}</p>
          <h2 className="vysiongids-info-title">{t('listing.infoExtras.hiringTitle')}</h2>
          <div className="vysiongids-hiring-card">
            <h3 className="vysiongids-hiring-card-title">{hiringTitle}</h3>
            {hiringTypeLabels.length && hiring.title?.trim() ? (
              <p className="vysiongids-hiring-types">{hiringTypeLabels.join(' · ')}</p>
            ) : null}
            {hiring.text ? <p className="vysiongids-hiring-text">{hiring.text}</p> : null}
            {hiring.hours?.trim() ? (
              <p className="vysiongids-hiring-hours">
                <strong>{t('listing.infoExtras.hoursPrefix')} </strong>
                {hiring.hours.trim()}
              </p>
            ) : null}
            {hiring.email || hiring.phone || listing.email || listing.phone ? (
              <div className="vysiongids-hiring-contact">
                <span>{t('listing.infoExtras.contactPrompt')}</span>
                <div className="vysiongids-hiring-contact-btns">
                  {(hiring.email?.trim() || listing.email?.trim()) ? (
                    <a
                      href={`mailto:${encodeURIComponent((hiring.email?.trim() || listing.email) ?? '')}?subject=${encodeURIComponent(t('listing.infoExtras.applicationSubject', { name: listing.name }))}`}
                      className="vysiongids-hiring-email"
                    >
                      {t('listing.infoExtras.emailButton')}
                    </a>
                  ) : null}
                  {(hiring.phone?.trim() || listing.phone?.trim()) ? (
                    <a
                      href={
                        belgiumPhoneTelHref(hiring.phone || listing.phone) ??
                        `tel:${(hiring.phone || listing.phone || '').replace(/\s/g, '')}`
                      }
                      className="vysiongids-hiring-phone"
                    >
                      {t('common.phone')}
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {gift ? (
        <section className="vysiongids-info-block vysiongids-info-block--gift">
          <p className="vysiongids-info-kicker">{t('listing.infoExtras.giftKicker')}</p>
          <h2 className="vysiongids-info-title">{t('listing.infoExtras.giftTitle')}</h2>
          {gift.intro ? <p className="vysiongids-gift-intro">{gift.intro}</p> : null}
          {gift.orderUrl ? (
            <a href={gift.orderUrl} target="_blank" rel="noopener noreferrer" className="vysiongids-gift-order-btn">
              {t('listing.infoExtras.giftOrderButton')}
            </a>
          ) : null}
          <div className="vysiongids-gift-card-preview" aria-hidden>
            <span className="vysiongids-gift-card-label">{t('listing.infoExtras.giftCardLabel')}</span>
            <span className="vysiongids-gift-card-name">{listing.name}</span>
            {giftValue ? (
              <div className="vysiongids-gift-card-value-wrap">
                <span className="vysiongids-gift-card-value-label">{t('listing.infoExtras.giftValueLabel')}</span>
                <span className="vysiongids-gift-card-value">{giftValue}</span>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {promotion ? (
        <section className="vysiongids-info-block vysiongids-info-block--promotion">
          <p className="vysiongids-info-kicker">{t('listing.infoExtras.promoKicker')}</p>
          <h2 className="vysiongids-info-title">{t('listing.infoExtras.promoTitle')}</h2>
          <div className="vysiongids-promotion-card">
            {promotion.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={promotion.imageUrl} alt="" className="vysiongids-promotion-card-img" />
            ) : null}
            {promotion.text ? <p className="vysiongids-promotion-card-text">{promotion.text}</p> : null}
            {promotion.offers?.length ? (
              <ListingPromotionOffersList
                offers={promotion.offers}
                className="vysiongids-promotion-offers-list vysiongids-promotion-offers-list--card"
              />
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  )
}

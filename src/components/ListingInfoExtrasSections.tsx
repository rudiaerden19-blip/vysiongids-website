import type { Listing } from '@/lib/listing-types'
import { listingHasInfoExtras } from '@/lib/listing-info-extras'

type Props = {
  listing: Listing
}

export default function ListingInfoExtrasSections({ listing }: Props) {
  const extras = listing.infoExtras
  if (!listingHasInfoExtras(extras)) return null

  const specialties = extras?.specialties?.filter((s) => s.caption || s.imageUrl) ?? []
  const hiring = extras?.hiring?.enabled ? extras.hiring : null
  const gift = extras?.giftCard?.enabled ? extras.giftCard : null
  const giftValue =
    gift?.valueEur != null && Number.isFinite(gift.valueEur)
      ? `€${gift.valueEur.toFixed(0)}`
      : null

  return (
    <div className="vysiongids-zaak-info-extras">
      {specialties.length > 0 ? (
        <section className="vysiongids-info-block vysiongids-info-block--specialties">
          <p className="vysiongids-info-kicker">ONZE KEUKEN</p>
          <h2 className="vysiongids-info-title">Onze specialiteiten</h2>
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
        <section className="vysiongids-info-block vysiongids-info-block--hiring">
          <p className="vysiongids-info-kicker">KOM BIJ ONS TEAM</p>
          <h2 className="vysiongids-info-title">Wij zoeken personeel</h2>
          <div className="vysiongids-hiring-card">
            {hiring.text ? <p className="vysiongids-hiring-text">{hiring.text}</p> : null}
            {hiring.phone ? (
              <div className="vysiongids-hiring-contact">
                <span>Interesse? Neem contact op:</span>
                <a href={`tel:${hiring.phone.replace(/\s/g, '')}`} className="vysiongids-hiring-phone">
                  {hiring.phone}
                </a>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {gift ? (
        <section className="vysiongids-info-block vysiongids-info-block--gift">
          <p className="vysiongids-info-kicker">HET PERFECTE CADEAU</p>
          <h2 className="vysiongids-info-title">Geef iemand een verrassing</h2>
          {gift.intro ? <p className="vysiongids-gift-intro">{gift.intro}</p> : null}
          {gift.orderUrl ? (
            <a href={gift.orderUrl} target="_blank" rel="noopener noreferrer" className="vysiongids-gift-order-btn">
              Cadeaubon bestellen
            </a>
          ) : null}
          <div className="vysiongids-gift-card-preview" aria-hidden>
            <span className="vysiongids-gift-card-label">Cadeaubon</span>
            <span className="vysiongids-gift-card-name">{listing.name}</span>
            {giftValue ? (
              <div className="vysiongids-gift-card-value-wrap">
                <span className="vysiongids-gift-card-value-label">Waarde</span>
                <span className="vysiongids-gift-card-value">{giftValue}</span>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  )
}

'use client'

import { useLanguage } from '@/i18n/LanguageProvider'
import Link from 'next/link'
import { useMemo } from 'react'
import type { Listing } from '@/lib/listing-types'
import type { GidsMenuCatalog, GidsMenuCategory, GidsMenuProduct } from '@/lib/gids-menu-types'
import { sanitizeMenuImageUrl } from '@/lib/gids-menu-image-url'

type Props = {
  listing: Listing
  catalog: GidsMenuCatalog
}

function formatPrice(value: number | null): string {
  if (value == null) return ''
  return `€${value.toFixed(2).replace('.', ',')}`
}

function categoryTitle(cat: GidsMenuCategory, index: number): string {
  const name = cat.name?.trim()
  if (name) return name
  return `Categorie ${index + 1}`
}

function MenuProductRow({ product }: { product: GidsMenuProduct }) {
  const imageSrc = sanitizeMenuImageUrl(product.imageUrl)
  return (
    <li className="vysiongids-menu-catalog-item">
      {imageSrc ? (
        <div className="vysiongids-menu-catalog-thumb">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageSrc} alt="" className="vysiongids-menu-catalog-thumb-img" loading="lazy" />
        </div>
      ) : (
        <div className="vysiongids-menu-catalog-thumb vysiongids-menu-catalog-thumb--empty" aria-hidden />
      )}
      <div className="vysiongids-menu-catalog-item-body">
        <div className="vysiongids-menu-catalog-item-head">
          <h3 className="vysiongids-menu-catalog-item-name">{product.name}</h3>
          {product.priceEur != null ? (
            <span className="vysiongids-menu-catalog-item-price">{formatPrice(product.priceEur)}</span>
          ) : null}
        </div>
        {product.description ? (
          <p className="vysiongids-menu-catalog-item-desc">{product.description}</p>
        ) : null}
      </div>
    </li>
  )
}

export default function GidsMenuPublicView({ listing, catalog }: Props) {
  const { t } = useLanguage()
  const sections = useMemo(() => {
    return catalog.categories
      .filter((c) => c.isActive)
      .map((c) => ({
        category: c,
        products: c.products.filter((p) => p.isActive && p.name.trim()),
      }))
      .filter((s) => s.products.length > 0)
  }, [catalog])

  const zaakHref = `/zaak/${listing.slug}`
  const totalProducts = sections.reduce((n, s) => n + s.products.length, 0)

  return (
    <div className="vysiongids-menu-catalog">
      <header className="vysiongids-menu-catalog-header">
        <Link href={zaakHref} className="vysiongids-menu-catalog-back">
          ← Terug
        </Link>
        <h1 className="vysiongids-menu-catalog-title">{listing.name}</h1>
        <p className="vysiongids-menu-catalog-sub">{t('beheer.menuCardTitle')}</p>
      </header>

      {sections.length === 0 ? (
        <p className="vysiongids-menu-catalog-empty">Dit menu is nog leeg.</p>
      ) : (
        <div className="vysiongids-menu-catalog-sections">
          {sections.map((section, index) => (
            <section key={section.category.id} className="vysiongids-menu-catalog-section">
              <h2 className="vysiongids-menu-catalog-section-title">
                {categoryTitle(section.category, index)}
              </h2>
              <ul className="vysiongids-menu-catalog-list">
                {section.products.map((p) => (
                  <MenuProductRow key={p.id} product={p} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {totalProducts === 0 ? null : (
        <p className="vysiongids-menu-catalog-footer-count">
          {totalProducts} {totalProducts === 1 ? 'gerecht' : 'gerechten'}
        </p>
      )}
    </div>
  )
}

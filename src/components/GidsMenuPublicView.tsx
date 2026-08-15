'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { Listing } from '@/lib/listing-types'
import type { GidsMenuCatalog } from '@/lib/gids-menu-types'

type Props = {
  listing: Listing
  catalog: GidsMenuCatalog
}

function formatPrice(value: number | null): string {
  if (value == null) return ''
  return `€${value.toFixed(2).replace('.', ',')}`
}

export default function GidsMenuPublicView({ listing, catalog }: Props) {
  const categories = useMemo(
    () => catalog.categories.filter((c) => c.isActive && c.products.some((p) => p.isActive)),
    [catalog],
  )

  const [activeId, setActiveId] = useState<string>(() => categories[0]?.id ?? 'all')

  const products =
    activeId === 'all'
      ? categories.flatMap((c) => c.products.filter((p) => p.isActive))
      : (categories.find((c) => c.id === activeId)?.products.filter((p) => p.isActive) ?? [])

  const zaakHref = `/zaak/${listing.slug}`

  return (
    <div className="vysiongids-menu-catalog">
      <header className="vysiongids-menu-catalog-header">
        <Link href={zaakHref} className="vysiongids-menu-catalog-back">
          ← Terug
        </Link>
        <h1 className="vysiongids-menu-catalog-title">{listing.name}</h1>
        <p className="vysiongids-menu-catalog-sub">Menukaart</p>
      </header>

      {categories.length > 1 ? (
        <div className="vysiongids-menu-catalog-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            className={`vysiongids-menu-catalog-tab${activeId === 'all' ? ' is-active' : ''}`}
            onClick={() => setActiveId('all')}
          >
            Alles
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              className={`vysiongids-menu-catalog-tab${activeId === c.id ? ' is-active' : ''}`}
              onClick={() => setActiveId(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      ) : null}

      <ul className="vysiongids-menu-catalog-list">
        {products.map((p) => (
          <li key={p.id} className="vysiongids-menu-catalog-item">
            {p.imageUrl ? (
              <div className="vysiongids-menu-catalog-thumb">
                <Image src={p.imageUrl} alt="" width={88} height={88} className="object-cover" unoptimized />
              </div>
            ) : (
              <div className="vysiongids-menu-catalog-thumb vysiongids-menu-catalog-thumb--empty" aria-hidden />
            )}
            <div className="vysiongids-menu-catalog-item-body">
              <div className="vysiongids-menu-catalog-item-head">
                <h2 className="vysiongids-menu-catalog-item-name">{p.name}</h2>
                {p.priceEur != null ? (
                  <span className="vysiongids-menu-catalog-item-price">{formatPrice(p.priceEur)}</span>
                ) : null}
              </div>
              {p.description ? (
                <p className="vysiongids-menu-catalog-item-desc">{p.description}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      {products.length === 0 ? (
        <p className="vysiongids-menu-catalog-empty">Dit menu is nog leeg.</p>
      ) : null}
    </div>
  )
}

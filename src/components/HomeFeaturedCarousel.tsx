'use client'

import { useCallback, useEffect, useState } from 'react'
import ListingPanel from '@/components/ListingPanel'
import type { Listing } from '@/lib/listing-types'

const SLIDE_MS = 6000
const TRANSITION_MS = 550

type Props = {
  listings: Listing[]
}

export default function HomeFeaturedCarousel({ listings }: Props) {
  const total = listings.length
  const [index, setIndex] = useState(0)

  const goTo = useCallback(
    (next: number) => {
      if (total <= 1) return
      setIndex((next + total) % total)
    },
    [total],
  )

  const goPrev = useCallback(() => goTo(index - 1), [goTo, index])
  const goNext = useCallback(() => goTo(index + 1), [goTo, index])

  useEffect(() => {
    if (total <= 1) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % total)
    }, SLIDE_MS)
    return () => window.clearInterval(id)
  }, [total])

  if (total === 1) {
    return (
      <div className="vysiongids-home-featured-viewport">
        <ListingPanel listing={listings[0]!} />
      </div>
    )
  }

  return (
    <div className="vysiongids-home-featured-carousel">
      <div className="vysiongids-home-featured-carousel-stage">
        <button
          type="button"
          className="vysiongids-home-featured-arrow vysiongids-home-featured-arrow--prev"
          aria-label="Vorige zaak"
          onClick={goPrev}
        >
          ‹
        </button>
        <div className="vysiongids-home-featured-viewport" aria-live="polite">
          <div
            className="vysiongids-home-featured-track"
            style={{
              transform: `translateX(-${index * 100}%)`,
              transition: `transform ${TRANSITION_MS}ms ease-in-out`,
            }}
          >
            {listings.map((listing) => (
              <div key={listing.slug} className="vysiongids-home-featured-slide">
                <ListingPanel listing={listing} />
              </div>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="vysiongids-home-featured-arrow vysiongids-home-featured-arrow--next"
          aria-label="Volgende zaak"
          onClick={goNext}
        >
          ›
        </button>
      </div>

      <div className="vysiongids-home-featured-dots">
        {listings.map((l, i) => (
          <button
            key={l.slug}
            type="button"
            className={`vysiongids-home-featured-dot${i === index ? ' is-active' : ''}`}
            aria-label={`Zaak ${i + 1} van ${total}`}
            aria-current={i === index ? 'true' : undefined}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </div>
  )
}

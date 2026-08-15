'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ListingPhoto from '@/components/ListingPhoto'

const SLIDE_MS = 3000
const FADE_MS = 500

type Props = {
  urls: string[]
  alt: string
  sizes: string
  className?: string
  priority?: boolean
  /** Pijltjes op zaakpagina; zoekkaart = alleen automatisch */
  showControls?: boolean
}

function uniqueUrls(urls: string[]): string[] {
  const out: string[] = []
  for (const u of urls) {
    const t = u?.trim()
    if (!t || out.includes(t)) continue
    out.push(t)
  }
  return out
}

export default function ListingPhotoSlider({
  urls,
  alt,
  sizes,
  className,
  priority,
  showControls = false,
}: Props) {
  const slides = useMemo(() => uniqueUrls(urls), [urls])
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const fadeTimeoutRef = useRef<number | null>(null)
  const total = slides.length

  const clearFadeTimeout = useCallback(() => {
    if (fadeTimeoutRef.current !== null) {
      window.clearTimeout(fadeTimeoutRef.current)
      fadeTimeoutRef.current = null
    }
  }, [])

  const advance = useCallback(
    (delta: number) => {
      if (total <= 1) return
      clearFadeTimeout()
      setVisible(false)
      fadeTimeoutRef.current = window.setTimeout(() => {
        setIndex((i) => (i + delta + total) % total)
        setVisible(true)
        fadeTimeoutRef.current = null
      }, FADE_MS)
    },
    [clearFadeTimeout, total],
  )

  const goPrev = useCallback(() => advance(-1), [advance])
  const goNext = useCallback(() => advance(1), [advance])

  useEffect(() => {
    if (total <= 1) return
    const id = window.setInterval(goNext, SLIDE_MS)
    return () => {
      window.clearInterval(id)
      clearFadeTimeout()
    }
  }, [goNext, clearFadeTimeout, total])

  useEffect(() => {
    setIndex(0)
    setVisible(true)
  }, [slides])

  if (total === 0) {
    return (
      <ListingPhoto src="" alt={alt} sizes={sizes} className={className} priority={priority} />
    )
  }

  if (total === 1) {
    return (
      <ListingPhoto
        src={slides[0]!}
        alt={alt}
        sizes={sizes}
        className={className}
        priority={priority}
      />
    )
  }

  const src = slides[index]!

  return (
    <div className="vysiongids-listing-photo-slider">
      <div
        className={`vysiongids-listing-photo-slider-stage ${visible ? 'is-visible' : ''}`}
        aria-live="polite"
      >
        <ListingPhoto
          key={src}
          src={src}
          alt={`${alt} — foto ${index + 1} van ${total}`}
          sizes={sizes}
          className={className}
          priority={priority && index === 0}
        />
      </div>

      {showControls ? (
        <>
          <button
            type="button"
            className="vysiongids-listing-photo-slider-arrow vysiongids-listing-photo-slider-arrow--prev"
            aria-label="Vorige foto"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              goPrev()
            }}
          >
            ‹
          </button>
          <button
            type="button"
            className="vysiongids-listing-photo-slider-arrow vysiongids-listing-photo-slider-arrow--next"
            aria-label="Volgende foto"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              goNext()
            }}
          >
            ›
          </button>
        </>
      ) : null}

      <div className="vysiongids-listing-photo-slider-dots" aria-hidden={total <= 1}>
        {slides.map((_, i) => (
          <span
            key={i}
            className={`vysiongids-listing-photo-slider-dot${i === index ? ' is-active' : ''}`}
          />
        ))}
      </div>
    </div>
  )
}

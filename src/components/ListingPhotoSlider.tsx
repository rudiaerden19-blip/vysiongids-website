'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ListingPhoto from '@/components/ListingPhoto'

const SLIDE_MS = 6000
const FADE_MS = 500

type Props = {
  urls: string[]
  alt: string
  sizes: string
  className?: string
  priority?: boolean
  /** Vorige/volgende pijltjes (zaakpagina, zoekresultaten) */
  showControls?: boolean
  /** Automatisch wisselen (alleen zaakpagina) */
  autoPlay?: boolean
  objectFit?: 'cover' | 'contain'
  layout?: 'fill' | 'intrinsic'
  onSlideIndexChange?: (index: number) => void
  /** Sync slide (bijv. na lightbox) zonder de slider opnieuw te mounten. */
  activeIndex?: number
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
  autoPlay = false,
  objectFit = 'cover',
  layout = 'fill',
  onSlideIndexChange,
  activeIndex,
}: Props) {
  const slidesKey = urls
    .map((u) => (u ?? '').trim())
    .filter(Boolean)
    .join('\n')
  const slides = useMemo(() => (slidesKey ? uniqueUrls(slidesKey.split('\n')) : []), [slidesKey])
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const fadeTimeoutRef = useRef<number | null>(null)
  const lastNotifiedIndex = useRef<number | null>(null)
  const total = slides.length
  const noFade = showControls && !autoPlay

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
      // Handmatige slider: geen fade (voorkomt flikkeren bij contain/intrinsic layout).
      if (noFade) {
        setIndex((i) => (i + delta + total) % total)
        setVisible(true)
        return
      }
      setVisible(false)
      fadeTimeoutRef.current = window.setTimeout(() => {
        setIndex((i) => (i + delta + total) % total)
        setVisible(true)
        fadeTimeoutRef.current = null
      }, FADE_MS)
    },
    [clearFadeTimeout, noFade, total],
  )

  const goPrev = useCallback(() => advance(-1), [advance])
  const goNext = useCallback(() => advance(1), [advance])

  useEffect(() => {
    if (!autoPlay || total <= 1) return
    const id = window.setInterval(goNext, SLIDE_MS)
    return () => {
      window.clearInterval(id)
      clearFadeTimeout()
    }
  }, [autoPlay, goNext, clearFadeTimeout, total])

  useEffect(() => {
    setIndex(0)
    setVisible(true)
    lastNotifiedIndex.current = null
  }, [slidesKey])

  useEffect(() => {
    if (lastNotifiedIndex.current === index) return
    lastNotifiedIndex.current = index
    onSlideIndexChange?.(index)
  }, [index, onSlideIndexChange])

  useEffect(() => {
    if (activeIndex === undefined || total === 0) return
    const next = ((activeIndex % total) + total) % total
    setIndex((i) => (i === next ? i : next))
    setVisible(true)
  }, [activeIndex, total])

  if (total === 0) {
    return (
      <ListingPhoto
        src=""
        alt={alt}
        sizes={sizes}
        className={className}
        priority={priority}
        objectFit={objectFit}
        layout={layout}
      />
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
        objectFit={objectFit}
        layout={layout}
      />
    )
  }

  if (!autoPlay && !showControls) {
    return (
      <ListingPhoto
        src={slides[0]!}
        alt={alt}
        sizes={sizes}
        className={className}
        priority={priority}
        objectFit={objectFit}
        layout={layout}
      />
    )
  }

  const src = slides[index]!
  const sliderClass =
    layout === 'intrinsic'
      ? 'vysiongids-listing-photo-slider vysiongids-listing-photo-slider--intrinsic'
      : 'vysiongids-listing-photo-slider'
  const stageVisible = visible || noFade
  const stageClass = [
    'vysiongids-listing-photo-slider-stage',
    stageVisible ? 'is-visible' : '',
    noFade ? 'vysiongids-listing-photo-slider-stage--no-fade' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={sliderClass}>
      <div className={stageClass} aria-live="polite">
        <ListingPhoto
          src={src}
          alt={`${alt} — foto ${index + 1} van ${total}`}
          sizes={sizes}
          className={className}
          priority={priority && index === 0}
          objectFit={objectFit}
          layout={layout}
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

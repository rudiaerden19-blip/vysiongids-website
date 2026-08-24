'use client'

import { useMemo, useState } from 'react'
import ListingPhotoSlider from '@/components/ListingPhotoSlider'
import ZoekertjePhotoLightbox from '@/components/ZoekertjePhotoLightbox'

type Props = {
  urls: string[]
  alt: string
}

export default function DienstenDetailGallery({ urls, alt }: Props) {
  const photos = useMemo(
    () =>
      urls
        .map((u) => u?.trim())
        .filter(Boolean)
        .map((publicUrl) => ({ publicUrl: publicUrl! })),
    [urls],
  )
  const sliderUrls = useMemo(() => photos.map((p) => p.publicUrl), [photos])
  const [slideIndex, setSlideIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (photos.length === 0) {
    return (
      <div className="vysiongids-diensten-detail-gallery">
        <div className="vysiongids-diensten-detail-gallery-stage">
          <ListingPhotoSlider urls={[]} alt={alt} sizes="(max-width: 768px) 100vw, 480px" objectFit="contain" />
        </div>
      </div>
    )
  }

  return (
    <div className="vysiongids-diensten-detail-gallery">
      <div className="vysiongids-diensten-detail-gallery-stage">
        <ListingPhotoSlider
          urls={sliderUrls}
          alt={alt}
          sizes="(max-width: 768px) 100vw, 480px"
          showControls
          priority
          objectFit="contain"
          onSlideIndexChange={setSlideIndex}
          activeIndex={lightboxOpen ? slideIndex : undefined}
        />
      </div>
      <button
        type="button"
        className="vysiongids-diensten-detail-gallery-enlarge"
        onClick={() => setLightboxOpen(true)}
      >
        Klik om te vergroten
      </button>
      <ZoekertjePhotoLightbox
        open={lightboxOpen}
        photos={photos}
        index={slideIndex}
        onIndexChange={setSlideIndex}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  )
}

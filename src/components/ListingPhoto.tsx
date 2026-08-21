'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

const FALLBACK = '/images/placeholder-frituur.svg'

type Props = {
  src: string
  alt: string
  sizes: string
  className?: string
  priority?: boolean
  objectFit?: 'cover' | 'contain'
  /** Volledige foto op natuurlijke verhouding (geen crop, geen letterbox). */
  layout?: 'fill' | 'intrinsic'
}

export default function ListingPhoto({
  src,
  alt,
  sizes,
  className,
  priority,
  objectFit = 'cover',
  layout = 'fill',
}: Props) {
  const [currentSrc, setCurrentSrc] = useState(src || FALLBACK)
  const isRemote = currentSrc.startsWith('http://') || currentSrc.startsWith('https://')

  useEffect(() => {
    setCurrentSrc(src?.trim() || FALLBACK)
  }, [src])

  if (layout === 'intrinsic') {
    return (
      <Image
        src={currentSrc}
        alt={alt}
        width={0}
        height={0}
        sizes={sizes}
        priority={priority}
        unoptimized={isRemote}
        className={className}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        onError={() => {
          if (currentSrc !== FALLBACK) setCurrentSrc(FALLBACK)
        }}
      />
    )
  }

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={isRemote}
      className={className}
      style={{ objectFit, objectPosition: 'center' }}
      onError={() => {
        if (currentSrc !== FALLBACK) setCurrentSrc(FALLBACK)
      }}
    />
  )
}

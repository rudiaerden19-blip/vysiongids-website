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
}

export default function ListingPhoto({
  src,
  alt,
  sizes,
  className,
  priority,
}: Props) {
  const [currentSrc, setCurrentSrc] = useState(src || FALLBACK)
  const isRemote = currentSrc.startsWith('http://') || currentSrc.startsWith('https://')

  useEffect(() => {
    setCurrentSrc(src?.trim() || FALLBACK)
  }, [src])

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={isRemote}
      className={className}
      style={{ objectFit: 'cover' }}
      onError={() => {
        if (currentSrc !== FALLBACK) setCurrentSrc(FALLBACK)
      }}
    />
  )
}

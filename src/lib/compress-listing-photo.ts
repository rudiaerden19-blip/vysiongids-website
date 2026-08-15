import { GIDS_REGISTER_MAX_PHOTO_BYTES } from '@/lib/gids-register-limits'

const MAX_EDGE_STEPS = [1920, 1600, 1280, 1024, 800] as const
const QUALITY_STEPS = [0.88, 0.82, 0.76, 0.7, 0.64, 0.58, 0.52] as const

function scaledSize(width: number, height: number, maxEdge: number): { w: number; h: number } {
  const longest = Math.max(width, height)
  if (longest <= maxEdge) return { w: width, h: height }
  const scale = maxEdge / longest
  return { w: Math.round(width * scale), h: Math.round(height * scale) }
}

async function loadDrawable(file: File): Promise<{
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
  width: number
  height: number
  dispose: () => void
}> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file)
    return {
      width: bitmap.width,
      height: bitmap.height,
      draw: (ctx, w, h) => {
        ctx.drawImage(bitmap, 0, 0, w, h)
      },
      dispose: () => bitmap.close(),
    }
  }

  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Afbeelding laden mislukt'))
      el.src = url
    })
    return {
      width: img.naturalWidth,
      height: img.naturalHeight,
      draw: (ctx, w, h) => {
        ctx.drawImage(img, 0, 0, w, h)
      },
      dispose: () => {},
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality)
  })
}

function outputName(original: File): string {
  const base = original.name.replace(/\.[^.]+$/, '').replace(/[^\w.-]+/g, '-').slice(0, 40)
  return `${base || 'foto'}.jpg`
}

/** Verkleint horeca-foto's in de browser vóór upload (JPEG, onder serverlimiet). */
export async function compressListingPhoto(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Geen afbeelding')
  }

  const drawable = await loadDrawable(file)
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas niet beschikbaar')

    for (const maxEdge of MAX_EDGE_STEPS) {
      const { w, h } = scaledSize(drawable.width, drawable.height, maxEdge)
      canvas.width = w
      canvas.height = h
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
      drawable.draw(ctx, w, h)

      for (const quality of QUALITY_STEPS) {
        const blob = await canvasToJpegBlob(canvas, quality)
        if (!blob) continue
        if (blob.size <= GIDS_REGISTER_MAX_PHOTO_BYTES) {
          return new File([blob], outputName(file), { type: 'image/jpeg', lastModified: Date.now() })
        }
      }
    }

    const blob = await canvasToJpegBlob(canvas, 0.48)
    if (blob && blob.size <= GIDS_REGISTER_MAX_PHOTO_BYTES * 1.05) {
      return new File([blob], outputName(file), { type: 'image/jpeg', lastModified: Date.now() })
    }

    throw new Error('Kon foto niet klein genoeg maken')
  } finally {
    drawable.dispose()
  }
}

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

const TRIM_WHITE_MIN = 248

function pixelNearWhite(data: Uint8ClampedArray, i: number): boolean {
  const a = data[i + 3]!
  if (a < 12) return true
  return data[i]! >= TRIM_WHITE_MIN && data[i + 1]! >= TRIM_WHITE_MIN && data[i + 2]! >= TRIM_WHITE_MIN
}

/** Snij witte randen (screenshots/export) weg zodat cover op kaarten het gebouw toont. */
function trimNearWhiteMargins(source: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = source.getContext('2d')
  if (!ctx) return source
  const { width, height } = source
  if (width < 8 || height < 8) return source

  const data = ctx.getImageData(0, 0, width, height).data

  let top = 0
  let bottom = height - 1
  let left = 0
  let right = width - 1

  rowScan: for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      if (!pixelNearWhite(data, i)) {
        top = y
        break rowScan
      }
    }
  }

  rowScanBottom: for (let y = height - 1; y >= top; y--) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      if (!pixelNearWhite(data, i)) {
        bottom = y
        break rowScanBottom
      }
    }
  }

  colScan: for (let x = 0; x < width; x++) {
    for (let y = top; y <= bottom; y++) {
      const i = (y * width + x) * 4
      if (!pixelNearWhite(data, i)) {
        left = x
        break colScan
      }
    }
  }

  colScanRight: for (let x = width - 1; x >= left; x--) {
    for (let y = top; y <= bottom; y++) {
      const i = (y * width + x) * 4
      if (!pixelNearWhite(data, i)) {
        right = x
        break colScanRight
      }
    }
  }

  const cropW = right - left + 1
  const cropH = bottom - top + 1
  if (cropW < 24 || cropH < 24) return source
  if (cropW > width * 0.98 && cropH > height * 0.98) return source

  const pad = Math.min(4, Math.floor(Math.min(cropW, cropH) * 0.01))
  const x0 = Math.max(0, left - pad)
  const y0 = Math.max(0, top - pad)
  const x1 = Math.min(width - 1, right + pad)
  const y1 = Math.min(height - 1, bottom + pad)
  const outW = x1 - x0 + 1
  const outH = y1 - y0 + 1

  const out = document.createElement('canvas')
  out.width = outW
  out.height = outH
  const octx = out.getContext('2d')
  if (!octx) return source
  octx.drawImage(source, x0, y0, outW, outH, 0, 0, outW, outH)
  return out
}

function prepareListingPhotoCanvas(
  drawable: { draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void; width: number; height: number },
  maxEdge: number,
): HTMLCanvasElement {
  const { w, h } = scaledSize(drawable.width, drawable.height, maxEdge)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas niet beschikbaar')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  drawable.draw(ctx, w, h)
  return trimNearWhiteMargins(canvas)
}

/** Verkleint horeca-foto's in de browser vóór upload (JPEG, onder serverlimiet). */
export async function compressListingPhoto(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Geen afbeelding')
  }

  const drawable = await loadDrawable(file)
  try {
    let canvas = prepareListingPhotoCanvas(drawable, MAX_EDGE_STEPS[0])

    for (const maxEdge of MAX_EDGE_STEPS) {
      canvas = prepareListingPhotoCanvas(drawable, maxEdge)

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

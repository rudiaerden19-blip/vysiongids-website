'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { GidsMenuCatalog, GidsMenuCategory, GidsMenuProduct } from '@/lib/gids-menu-types'
import { compressListingPhoto } from '@/lib/compress-listing-photo'
import { sanitizeMenuImageUrl } from '@/lib/gids-menu-image-url'

function newId(): string {
  return crypto.randomUUID()
}

function emptyCategory(sortOrder: number): GidsMenuCategory {
  const id = newId()
  return {
    id,
    name: '',
    sortOrder,
    isActive: true,
    products: [],
  }
}

function emptyProduct(categoryId: string, sortOrder: number): GidsMenuProduct {
  return {
    id: newId(),
    categoryId,
    name: '',
    description: null,
    priceEur: null,
    imageUrl: null,
    sortOrder,
    isActive: true,
  }
}

export default function GidsMenuEditor() {
  const [categories, setCategories] = useState<GidsMenuCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [uploadingProductId, setUploadingProductId] = useState<string | null>(null)
  const [photoPreviewByProductId, setPhotoPreviewByProductId] = useState<Record<string, string>>({})
  const uploadSeqRef = useRef(0)

  useEffect(() => {
    fetch('/api/gids/me/menu')
      .then((r) => {
        if (r.status === 401) {
          setError('Log in via /login om je menu te beheren.')
          return null
        }
        return r.json()
      })
      .then((data: { catalog?: GidsMenuCatalog; error?: string } | null) => {
        if (!data) return
        if (data.catalog?.categories?.length) {
          setCategories(data.catalog.categories)
        } else {
          setCategories([emptyCategory(0)])
        }
      })
      .catch(() => setError('Menu laden mislukt.'))
      .finally(() => setLoading(false))
  }, [])

  const updateCategory = useCallback((id: string, patch: Partial<GidsMenuCategory>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }, [])

  const updateProduct = useCallback((categoryId: string, productId: string, patch: Partial<GidsMenuProduct>) => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== categoryId) return c
        return {
          ...c,
          products: c.products.map((p) => (p.id === productId ? { ...p, ...patch } : p)),
        }
      }),
    )
  }, [])

  const addCategory = () => {
    setCategories((prev) => [...prev, emptyCategory(prev.length)])
  }

  const removeCategory = (id: string) => {
    setCategories((prev) => (prev.length <= 1 ? prev : prev.filter((c) => c.id !== id)))
  }

  const addProduct = (categoryId: string) => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== categoryId) return c
        return { ...c, products: [...c.products, emptyProduct(categoryId, c.products.length)] }
      }),
    )
  }

  const removeProduct = (categoryId: string, productId: string) => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== categoryId) return c
        return { ...c, products: c.products.filter((p) => p.id !== productId) }
      }),
    )
  }

  async function uploadPhoto(categoryId: string, productId: string, file: File) {
    const seq = ++uploadSeqRef.current
    setUploadingProductId(productId)
    setError(null)

    let previewUrl: string | null = null
    try {
      previewUrl = URL.createObjectURL(file)
      setPhotoPreviewByProductId((prev) => ({ ...prev, [productId]: previewUrl! }))

      const compressed = await compressListingPhoto(file)
      if (seq !== uploadSeqRef.current) return

      const fd = new FormData()
      fd.set('productId', productId)
      fd.set('photo', compressed)

      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), 45000)

      const res = await fetch('/api/gids/me/menu/product-photo', {
        method: 'POST',
        body: fd,
        credentials: 'same-origin',
        signal: controller.signal,
      })
      window.clearTimeout(timeoutId)

      let data: { publicUrl?: string; error?: string } = {}
      try {
        data = (await res.json()) as { publicUrl?: string; error?: string }
      } catch {
        /* lege of ongeldige response */
      }

      if (seq !== uploadSeqRef.current) return
      if (!res.ok) throw new Error(data.error ?? 'Upload mislukt')
      if (!data.publicUrl) throw new Error('Geen foto-URL terug van server')

      updateProduct(categoryId, productId, { imageUrl: data.publicUrl })
      setPhotoPreviewByProductId((prev) => {
        const next = { ...prev }
        delete next[productId]
        return next
      })
    } catch (e) {
      if (seq !== uploadSeqRef.current) return
      const msg =
        e instanceof Error && e.name === 'AbortError'
          ? 'Upload duurde te lang. Probeer opnieuw of een kleinere foto.'
          : e instanceof Error
            ? e.message
            : 'Upload mislukt'
      setError(msg)
      setPhotoPreviewByProductId((prev) => {
        const next = { ...prev }
        delete next[productId]
        return next
      })
    } finally {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      if (seq === uploadSeqRef.current) {
        setUploadingProductId(null)
      }
    }
  }

  async function saveMenu() {
    if (uploadingProductId) {
      setError('Wacht tot de foto klaar is met uploaden, daarna opnieuw opslaan.')
      return
    }
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const payload = {
        categories: categories.map((c, ci) => ({
          id: c.id,
          name: c.name,
          sortOrder: ci,
          isActive: c.isActive,
          products: c.products.map((p, pi) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            priceEur: p.priceEur,
            imageUrl: sanitizeMenuImageUrl(p.imageUrl),
            sortOrder: pi,
            isActive: p.isActive,
          })),
        })),
      }
      const res = await fetch('/api/gids/me/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = (await res.json()) as { error?: string; ok?: boolean }
      if (!res.ok) throw new Error(data.error ?? 'Opslaan mislukt')
      setSuccess('Menu opgeslagen. Bezoekers zien het via de knop Menu op je profiel.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Opslaan mislukt')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-gray-600">Menu laden…</p>

  return (
    <div className="vysiongids-menu-editor space-y-6">
      <p className="text-sm text-gray-600">
        Bouw je menu zoals in de kassa: categorieën, producten, foto&apos;s en prijzen. Na opslaan opent de knop{' '}
        <strong>Menu</strong> dit overzicht voor klanten.
      </p>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
      {success ? <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-900">{success}</p> : null}

      {categories.map((cat, catIndex) => (
        <section key={cat.id} className="vysiongids-menu-editor-category rounded-xl border border-gray-200 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[12rem] flex-1">
              <label className="vysiongids-form-label" htmlFor={`cat-${cat.id}`}>
                Categorie {catIndex + 1}
              </label>
              <input
                id={`cat-${cat.id}`}
                className="vysiongids-form-input mt-1"
                value={cat.name}
                placeholder="Bv. Friet, Burgers, Drank"
                onChange={(e) => updateCategory(cat.id, { name: e.target.value })}
              />
            </div>
            <button
              type="button"
              className="text-sm font-semibold text-red-700 hover:underline"
              onClick={() => removeCategory(cat.id)}
            >
              Categorie verwijderen
            </button>
          </div>

          <ul className="mt-4 space-y-4">
            {cat.products.map((p, pi) => (
              <li key={p.id} className="rounded-lg bg-gray-50 p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Productnaam</label>
                    <input
                      className="vysiongids-form-input mt-1"
                      value={p.name}
                      placeholder="Naam"
                      onChange={(e) => updateProduct(cat.id, p.id, { name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Prijs (€)</label>
                    <input
                      className="vysiongids-form-input mt-1"
                      type="number"
                      min={0}
                      step={0.1}
                      value={p.priceEur ?? ''}
                      placeholder="Optioneel"
                      onChange={(e) => {
                        const v = e.target.value
                        updateProduct(cat.id, p.id, {
                          priceEur: v === '' ? null : Number(v.replace(',', '.')),
                        })
                      }}
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <label className="text-xs font-semibold text-gray-600">Omschrijving</label>
                  <textarea
                    className="vysiongids-form-input mt-1 min-h-[4rem]"
                    value={p.description ?? ''}
                    rows={2}
                    onChange={(e) => updateProduct(cat.id, p.id, { description: e.target.value || null })}
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {(() => {
                    const thumb = photoPreviewByProductId[p.id] ?? sanitizeMenuImageUrl(p.imageUrl)
                    return thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="" className="h-16 w-16 rounded-lg object-cover" />
                    ) : null
                  })()}
                  <label
                    className={`vysiongids-photo-pick-btn cursor-pointer${uploadingProductId === p.id ? ' opacity-70' : ''}`}
                  >
                    {uploadingProductId === p.id ? 'Bezig…' : photoPreviewByProductId[p.id] || sanitizeMenuImageUrl(p.imageUrl) ? 'Foto vervangen' : 'Foto toevoegen'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingProductId === p.id}
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) void uploadPhoto(cat.id, p.id, f)
                        e.target.value = ''
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="text-sm text-red-700 hover:underline"
                    onClick={() => removeProduct(cat.id, p.id)}
                  >
                    Product verwijderen
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">Product {pi + 1}</p>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="mt-3 text-sm font-semibold text-accent hover:underline"
            onClick={() => addProduct(cat.id)}
          >
            + Product in deze categorie
          </button>
        </section>
      ))}

      <div className="flex flex-wrap gap-3">
        <button type="button" className="rounded-lg border border-gray-300 px-4 py-2 font-semibold" onClick={addCategory}>
          + Categorie
        </button>
        <button
          type="button"
          disabled={saving}
          className="rounded-lg bg-accent px-5 py-2.5 font-semibold text-white disabled:opacity-60"
          onClick={() => void saveMenu()}
        >
          {saving ? 'Opslaan…' : 'Menu opslaan'}
        </button>
      </div>
    </div>
  )
}

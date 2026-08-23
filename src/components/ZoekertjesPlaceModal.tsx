'use client'

import { useLanguage } from '@/i18n/LanguageProvider'
import { useEffect, useId, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ZOEKERTJES_CATEGORIES,
  ZOEKERTJES_CONDITIONS,
  ZOEKERTJES_CONDITION_MESSAGE_KEYS,
  ZOEKERTJES_KINDS,
  ZOEKERTJES_KIND_MESSAGE_KEYS,
  guessZoekertjeCategoryFromTitle,
  zoekertjeCategoryMessageKey,
} from '@/lib/gids-zoekertjes-categories'
import { gidsZoekertjePriceForInput } from '@/lib/gids-zoekertjes-price'
import {
  normalizeZoekertjeDescriptionInput,
  normalizeZoekertjeOptionalLine,
  normalizeZoekertjeTitleInput,
} from '@/lib/gids-zoekertjes-text'
import { GIDS_ZOEKERTJES_SETUP_SQL_HINT } from '@/lib/gids-zoekertjes-db-errors'
import type { GidsZoekertje } from '@/lib/gids-zoekertjes-types'
import { GIDS_ZOEKERTJE_MAX_PHOTOS, GIDS_ZOEKERTJE_TITLE_MAX } from '@/lib/gids-zoekertjes-types'

type Props = {
  open: boolean
  onClose: () => void
  editId?: string | null
  onSaved?: () => void
  setupRequired?: boolean
}

type Step = 1 | 2 | 3 | 4 | 5

type PhotoSlot = {
  file: File
  preview: string
}

const STEP_TITLE_KEYS: Record<Step, string> = {
  1: 'zoekertjes.placeModal.step1Title',
  2: 'zoekertjes.placeModal.step2Title',
  3: 'zoekertjes.placeModal.step3Title',
  4: 'zoekertjes.placeModal.step4Title',
  5: 'zoekertjes.placeModal.step5Title',
}

export default function ZoekertjesPlaceModal({ open, onClose, editId, onSaved, setupRequired }: Props) {
  const { t } = useLanguage()
  const titleId = useId()
  const [step, setStep] = useState<Step>(1)
  const [titleHint, setTitleHint] = useState('')
  const [category, setCategory] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [condition, setCondition] = useState('')
  const [kind, setKind] = useState('')
  const [itemType, setItemType] = useState('')
  const [brand, setBrand] = useState('')
  const [price, setPrice] = useState('')
  const [photos, setPhotos] = useState<PhotoSlot[]>([])
  const [existingPhotoUrls, setExistingPhotoUrls] = useState<string[]>([])
  const [replaceAllPhotos, setReplaceAllPhotos] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loadingEdit, setLoadingEdit] = useState(false)

  const photoCount = photos.length + (replaceAllPhotos ? 0 : existingPhotoUrls.length)

  useEffect(() => {
    if (!open) return
    setError(null)
    if (!editId) {
      setStep(1)
      setTitleHint('')
      setCategory('')
      setTitle('')
      setDescription('')
      setCondition('')
      setKind('')
      setItemType('')
      setBrand('')
      setPrice('')
      setPhotos([])
      setExistingPhotoUrls([])
      setReplaceAllPhotos(false)
      return
    }

    setLoadingEdit(true)
    void (async () => {
      try {
        const r = await fetch(`/api/gids/zoekertjes/${editId}`, { credentials: 'same-origin' })
        const data = (await r.json()) as { zoekertje?: GidsZoekertje; error?: string }
        if (!r.ok || !data.zoekertje) {
          setError(data.error ?? t('errors.loadFailed'))
          return
        }
        const z = data.zoekertje
        setTitle(z.title)
        setTitleHint(z.title)
        setCategory(z.category)
        setDescription(z.description)
        setCondition(z.condition ?? '')
        setKind(z.kind ?? '')
        setItemType(z.itemType ?? '')
        setBrand(z.brand ?? '')
        setPrice(gidsZoekertjePriceForInput(z.price))
        setExistingPhotoUrls(z.photos.map((p) => p.publicUrl))
        setPhotos([])
        setReplaceAllPhotos(false)
        setStep(3)
      } catch {
        setError(t('errors.loadFailed'))
      } finally {
        setLoadingEdit(false)
      }
    })()
  }, [open, editId])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      for (const p of photos) URL.revokeObjectURL(p.preview)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup previews on close
  }, [open, onClose])

  function onVindCategorie() {
    const guess = guessZoekertjeCategoryFromTitle(titleHint)
    if (guess) {
      setCategory(guess)
      if (!title) setTitle(normalizeZoekertjeTitleInput(titleHint))
    } else {
      setError(t('zoekertjes.placeModal.categoryNotRecognized'))
    }
  }

  function onPickPhotos(files: FileList | null) {
    if (!files?.length) return
    setError(null)
    const next: PhotoSlot[] = [...photos]
    let total = replaceAllPhotos ? next.length : next.length + existingPhotoUrls.length
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      if (total >= GIDS_ZOEKERTJE_MAX_PHOTOS) break
      next.push({ file, preview: URL.createObjectURL(file) })
      total += 1
    }
    setPhotos(next)
  }

  function removeNewPhoto(index: number) {
    setPhotos((prev) => {
      const copy = [...prev]
      const removed = copy.splice(index, 1)[0]
      if (removed) URL.revokeObjectURL(removed.preview)
      return copy
    })
  }

  function validateStep(s: Step): string | null {
    if (s === 1) {
      if (!category) return t('zoekertjes.placeModal.chooseCategoryRequired')
      return null
    }
    if (s === 3) {
      if (!title.trim()) return t('zoekertjes.placeModal.titleRequiredError')
      if (!description.trim()) return t('zoekertjes.placeModal.descriptionRequiredError')
      return null
    }
    if (s === 5) {
      if (!price.trim()) return t('zoekertjes.placeModal.priceRequiredError')
      return null
    }
    return null
  }

  function goNext() {
    const err = validateStep(step)
    if (err) {
      setError(err)
      return
    }
    setError(null)
    if (step === 1 && titleHint.trim() && !title.trim()) {
      setTitle(normalizeZoekertjeTitleInput(titleHint))
    }
    if (step === 3) {
      setTitle(normalizeZoekertjeTitleInput(title))
      setDescription(normalizeZoekertjeDescriptionInput(description))
    }
    setStep((s) => (s < 5 ? ((s + 1) as Step) : s))
  }

  function goBack() {
    setError(null)
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s))
  }

  async function onPlaatsen() {
    const err = validateStep(5) ?? validateStep(3) ?? validateStep(1)
    if (err) {
      setError(err)
      return
    }
    setError(null)
    setSubmitting(true)
    const titleNorm = normalizeZoekertjeTitleInput(title)
    const descriptionNorm = normalizeZoekertjeDescriptionInput(description)
    setTitle(titleNorm)
    setDescription(descriptionNorm)
    try {
      const form = new FormData()
      form.set('title', titleNorm)
      form.set('description', descriptionNorm)
      form.set('category', category)
      form.set('condition', condition)
      form.set('kind', kind)
      form.set('itemType', itemType ? normalizeZoekertjeOptionalLine(itemType) : '')
      form.set('brand', brand ? normalizeZoekertjeOptionalLine(brand) : '')
      form.set('price', price.trim())
      if (editId && replaceAllPhotos) form.set('replaceAllPhotos', '1')

      const startIndex = editId && !replaceAllPhotos ? existingPhotoUrls.length : 0
      photos.forEach((p, i) => form.set(`photo_${startIndex + i}`, p.file))

      const url = editId ? `/api/gids/zoekertjes/${editId}` : '/api/gids/zoekertjes'
      const r = await fetch(url, {
        method: editId ? 'PATCH' : 'POST',
        credentials: 'same-origin',
        body: form,
      })
      const data = (await r.json().catch(() => ({}))) as { error?: string }
      if (!r.ok) {
        setError(data.error ?? t('errors.saveFailed'))
        return
      }
      onSaved?.()
      onClose()
    } catch {
      setError(t('errors.networkRetry'))
    } finally {
      setSubmitting(false)
    }
  }

  const categoryLabel = useMemo(
    () => (category ? t(zoekertjeCategoryMessageKey(category)) : ''),
    [category, t],
  )

  if (!open) return null

  const panel = (
    <div className="vysiongids-job-modal-root vysiongids-premium-modal-root vysiongids-zoekertje-modal-root" role="presentation">
      <button type="button" className="vysiongids-job-modal-backdrop" aria-label={t('common.close')} onClick={onClose} />
      <div
        className="vysiongids-job-modal-panel vysiongids-premium-modal-panel vysiongids-zoekertje-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button type="button" className="vysiongids-job-modal-close" onClick={onClose} aria-label={t('common.close')}>
          ×
        </button>
        <div className="vysiongids-premium-modal-scroll">
          <p className="vysiongids-job-modal-kicker">
            {t('zoekertjes.placeModal.kicker', { step })}
            {categoryLabel ? ` · ${categoryLabel}` : ''}
          </p>
          <h2 id={titleId} className="vysiongids-job-modal-title">
            {editId ? t('zoekertjes.placeModal.editTitle') : t(STEP_TITLE_KEYS[step])}
          </h2>

          {setupRequired && !editId ? (
            <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
              {GIDS_ZOEKERTJES_SETUP_SQL_HINT}
            </p>
          ) : null}

          {loadingEdit ? <p className="text-sm text-gray-600">{t('zoekertjes.placeModal.loadingEdit')}</p> : null}

          {!loadingEdit && step === 1 ? (
            <div className="vysiongids-zoekertje-modal-fields mt-4 space-y-4">
              <div>
                <label className="vysiongids-form-label text-sm" htmlFor="zoekertjeTitleHint">
                  {t('zoekertjes.placeModal.titleHintLabel')}
                </label>
                <div className="vysiongids-zoekertje-title-row mt-1">
                  <input
                    id="zoekertjeTitleHint"
                    type="text"
                    value={titleHint}
                    onChange={(e) => setTitleHint(e.target.value)}
                    className="vysiongids-form-input w-full text-sm"
                    placeholder={t('zoekertjes.placeModal.titleHintPlaceholder')}
                  />
                  <button type="button" className="vysiongids-zoekertje-primary-btn" onClick={onVindCategorie}>
                    {t('zoekertjes.placeModal.findCategory')}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">{t('zoekertjes.placeModal.titleHintSub')}</p>
              </div>
              <div>
                <label className="vysiongids-form-label text-sm" htmlFor="zoekertjeCategory">
                  {t('zoekertjes.placeModal.categoryManualLabel')}
                </label>
                <select
                  id="zoekertjeCategory"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="vysiongids-form-input mt-1 w-full text-sm"
                >
                  <option value="">{t('zoekertjes.placeModal.chooseCategory')}</option>
                  {ZOEKERTJES_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {t(zoekertjeCategoryMessageKey(c.id))}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

          {!loadingEdit && step === 2 ? (
            <div className="vysiongids-zoekertje-modal-fields mt-4">
              <p className="text-sm font-semibold text-gray-900">{t('zoekertjes.placeModal.photosHeading')}</p>
              <div className="vysiongids-zoekertje-photo-grid mt-2">
                <label className="vysiongids-zoekertje-photo-add">
                  <span className="text-accent font-semibold text-sm">{t('zoekertjes.placeModal.addPhotos')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(e) => onPickPhotos(e.target.files)}
                  />
                </label>
                {!replaceAllPhotos
                  ? existingPhotoUrls.map((url) => (
                      <div key={url} className="vysiongids-zoekertje-photo-thumb">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" />
                      </div>
                    ))
                  : null}
                {photos.map((p, i) => (
                  <div key={p.preview} className="vysiongids-zoekertje-photo-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.preview} alt="" />
                    <button type="button" className="vysiongids-zoekertje-photo-remove" onClick={() => removeNewPhoto(i)}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {t('zoekertjes.placeModal.photosUsed', {
                  count: photoCount,
                  max: GIDS_ZOEKERTJE_MAX_PHOTOS,
                })}
              </p>
              {editId && existingPhotoUrls.length > 0 ? (
                <button
                  type="button"
                  className="mt-2 text-xs font-semibold text-accent underline"
                  onClick={() => {
                    setReplaceAllPhotos(true)
                    setExistingPhotoUrls([])
                  }}
                >
                  {t('zoekertjes.placeModal.replaceAllPhotos')}
                </button>
              ) : null}
            </div>
          ) : null}

          {!loadingEdit && step === 3 ? (
            <div className="vysiongids-zoekertje-modal-fields mt-4 space-y-4">
              <div>
                <label className="vysiongids-form-label text-sm" htmlFor="zoekertjeTitle">
                  {t('zoekertjes.placeModal.titleRequired')}
                </label>
                <input
                  id="zoekertjeTitle"
                  type="text"
                  maxLength={GIDS_ZOEKERTJE_TITLE_MAX}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => setTitle(normalizeZoekertjeTitleInput(title))}
                  className="vysiongids-form-input mt-1 w-full text-sm"
                  required
                />
                <p className="mt-0.5 text-right text-xs text-gray-500">
                  {title.length}/{GIDS_ZOEKERTJE_TITLE_MAX}
                </p>
              </div>
              <div>
                <label className="vysiongids-form-label text-sm" htmlFor="zoekertjeDesc">
                  {t('zoekertjes.placeModal.descriptionRequired')}
                </label>
                <textarea
                  id="zoekertjeDesc"
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => setDescription(normalizeZoekertjeDescriptionInput(description))}
                  className="vysiongids-form-input mt-1 w-full text-sm"
                  required
                />
              </div>
            </div>
          ) : null}

          {!loadingEdit && step === 4 ? (
            <div className="vysiongids-zoekertje-modal-fields mt-4 space-y-3">
              <div>
                <label className="vysiongids-form-label text-sm">{t('zoekertjes.placeModal.conditionLabel')}</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="vysiongids-form-input mt-1 w-full text-sm"
                >
                  <option value="">{t('common.choose')}</option>
                  {ZOEKERTJES_CONDITIONS.map((o) => (
                    <option key={o} value={o}>
                      {t(ZOEKERTJES_CONDITION_MESSAGE_KEYS[o])}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="vysiongids-form-label text-sm">{t('zoekertjes.placeModal.kindLabel')}</label>
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                  className="vysiongids-form-input mt-1 w-full text-sm"
                >
                  <option value="">{t('common.choose')}</option>
                  {ZOEKERTJES_KINDS.map((o) => (
                    <option key={o} value={o}>
                      {t(ZOEKERTJES_KIND_MESSAGE_KEYS[o])}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="vysiongids-form-label text-sm" htmlFor="zoekertjeType">
                  {t('zoekertjes.placeModal.typeLabel')}
                </label>
                <input
                  id="zoekertjeType"
                  type="text"
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value)}
                  className="vysiongids-form-input mt-1 w-full text-sm"
                  placeholder={t('zoekertjes.placeModal.typePlaceholder')}
                />
              </div>
              <div>
                <label className="vysiongids-form-label text-sm" htmlFor="zoekertjeBrand">
                  {t('zoekertjes.placeModal.brandLabel')}
                </label>
                <input
                  id="zoekertjeBrand"
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="vysiongids-form-input mt-1 w-full text-sm"
                />
              </div>
            </div>
          ) : null}

          {!loadingEdit && step === 5 ? (
            <div className="vysiongids-zoekertje-modal-fields mt-4">
              <label className="vysiongids-form-label text-sm" htmlFor="zoekertjePrice">
                {t('zoekertjes.placeModal.priceRequired')}
              </label>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">€</span>
                <input
                  id="zoekertjePrice"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="vysiongids-form-input w-full text-sm"
                  placeholder={t('zoekertjes.placeModal.pricePlaceholder')}
                />
              </div>
            </div>
          ) : null}

          {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        </div>

        <div className="vysiongids-job-card-actions vysiongids-premium-modal-actions vysiongids-zoekertje-modal-actions">
          {step > 1 && step < 5 ? (
            <button type="button" className="vysiongids-job-card-btn vysiongids-job-card-btn--email" onClick={goBack}>
              {t('common.back')}
            </button>
          ) : null}
          {step < 5 ? (
            <button
              type="button"
              className="vysiongids-zoekertje-primary-btn vysiongids-zoekertje-primary-btn--wide"
              onClick={goNext}
              disabled={loadingEdit}
            >
              {t('common.next')}
            </button>
          ) : (
            <button
              type="button"
              className="vysiongids-zoekertje-primary-btn vysiongids-zoekertje-primary-btn--wide"
              disabled={submitting || loadingEdit}
              onClick={() => void onPlaatsen()}
            >
              {submitting
                ? t('zoekertjes.placeModal.submitBusy')
                : editId
                  ? t('zoekertjes.placeModal.submitSave')
                  : t('zoekertjes.placeModal.submitPlace')}
            </button>
          )}
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(panel, document.body)
}

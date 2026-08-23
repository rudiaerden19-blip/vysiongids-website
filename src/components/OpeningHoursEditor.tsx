'use client'

import { useLanguage } from '@/i18n/LanguageProvider'
import { useLayoutEffect, useMemo, useState } from 'react'
import {
  defaultWeekHoursFormState,
  hoursByDayToFormState,
  type DayHoursFormState,
  weekFormToHoursByDay,
} from '@/lib/gids-opening-hours'
import type { ListingDayHours, ListingWeekday } from '@/lib/listing-types'

export type OpeningHoursPayload = {
  json: string
  error: string | null
}

const WEEKDAY_DAY_KEY: Record<ListingWeekday, string> = {
  maandag: 'mon',
  dinsdag: 'tue',
  woensdag: 'wed',
  donderdag: 'thu',
  vrijdag: 'fri',
  zaterdag: 'sat',
  zondag: 'sun',
}

type OpeningHoursEditorProps = {
  initialHoursByDay?: ListingDayHours[]
  onPayloadChange?: (payload: OpeningHoursPayload) => void
}

export default function OpeningHoursEditor({ initialHoursByDay, onPayloadChange }: OpeningHoursEditorProps) {
  const { t } = useLanguage()
  const [days, setDays] = useState<DayHoursFormState[]>(() =>
    initialHoursByDay?.length === 7 ? hoursByDayToFormState(initialHoursByDay) : defaultWeekHoursFormState(),
  )

  const payload = useMemo(() => {
    const result = weekFormToHoursByDay(days)
    if ('error' in result) {
      return { json: '[]', error: result.error }
    }
    return { json: JSON.stringify(result.rows), error: null as string | null }
  }, [days])

  useLayoutEffect(() => {
    onPayloadChange?.(payload)
  }, [payload, onPayloadChange])

  function updateDay(index: number, patch: Partial<DayHoursFormState>) {
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)))
  }

  function setDayClosed(index: number, closed: boolean) {
    if (closed) {
      updateDay(index, { closed: true, shift2Enabled: false, shift2From: '', shift2To: '' })
      return
    }
    updateDay(index, { closed: false })
  }

  function setShift2Enabled(index: number, day: DayHoursFormState, enabled: boolean) {
    if (!enabled) {
      updateDay(index, { shift2Enabled: false, shift2From: '', shift2To: '' })
      return
    }
    updateDay(index, {
      shift2Enabled: true,
      shift2From: day.shift2From.trim() || '17:00',
      shift2To: day.shift2To.trim() || '22:00',
    })
  }

  return (
    <div className="vysiongids-opening-hours">
      <input type="hidden" name="hoursByDay" value={payload.json} readOnly />
      {days.map((day, index) => (
        <div key={day.day} className="vysiongids-opening-hours-day">
          <div className="vysiongids-opening-hours-day-head">
            <span className="vysiongids-opening-hours-day-label">
              {t(`common.days.${WEEKDAY_DAY_KEY[day.day]}`)}
            </span>
            <label className="vysiongids-opening-hours-closed">
              <input
                type="checkbox"
                checked={day.closed}
                onChange={(e) => setDayClosed(index, e.target.checked)}
              />
              {t('common.closed')}
            </label>
          </div>
          {!day.closed ? (
            <div className="vysiongids-opening-hours-shifts">
              <div className="vysiongids-opening-hours-shift">
                <span className="vysiongids-opening-hours-shift-label">{t('common.shift1')}</span>
                <input
                  type="time"
                  required
                  value={day.shift1From}
                  onChange={(e) => updateDay(index, { shift1From: e.target.value })}
                  className="vysiongids-form-input vysiongids-opening-hours-time"
                />
                <span className="text-sm text-gray-500">{t('common.until')}</span>
                <input
                  type="time"
                  required
                  value={day.shift1To}
                  onChange={(e) => updateDay(index, { shift1To: e.target.value })}
                  className="vysiongids-form-input vysiongids-opening-hours-time"
                />
              </div>
              <label className="vysiongids-opening-hours-shift2-toggle">
                <input
                  type="checkbox"
                  checked={day.shift2Enabled}
                  onChange={(e) => setShift2Enabled(index, day, e.target.checked)}
                />
                {t('forms.openingHours.secondShiftToggle')}
              </label>
              {day.shift2Enabled ? (
                <div className="vysiongids-opening-hours-shift">
                  <span className="vysiongids-opening-hours-shift-label">{t('common.shift2')}</span>
                  <input
                    type="time"
                    required={day.shift2Enabled}
                    value={day.shift2From}
                    onChange={(e) => updateDay(index, { shift2From: e.target.value })}
                    className="vysiongids-form-input vysiongids-opening-hours-time"
                  />
                  <span className="text-sm text-gray-500">{t('common.until')}</span>
                  <input
                    type="time"
                    required={day.shift2Enabled}
                    value={day.shift2To}
                    onChange={(e) => updateDay(index, { shift2To: e.target.value })}
                    className="vysiongids-form-input vysiongids-opening-hours-time"
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ))}
      {payload.error ? (
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-950" role="alert">
          {payload.error}
        </p>
      ) : (
        <p className="mt-2 text-xs text-gray-500">{t('beheer.editForm.openingHoursHint')}</p>
      )}
    </div>
  )
}

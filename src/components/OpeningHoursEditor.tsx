'use client'

import { useLayoutEffect, useMemo, useState } from 'react'
import {
  DAY_LABEL,
  defaultWeekHoursFormState,
  hoursByDayToFormState,
  type DayHoursFormState,
  weekFormToHoursByDay,
} from '@/lib/gids-opening-hours'
import type { ListingDayHours } from '@/lib/listing-types'

export type OpeningHoursPayload = {
  json: string
  error: string | null
}

type OpeningHoursEditorProps = {
  initialHoursByDay?: ListingDayHours[]
  onPayloadChange?: (payload: OpeningHoursPayload) => void
}

export default function OpeningHoursEditor({ initialHoursByDay, onPayloadChange }: OpeningHoursEditorProps) {
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

  return (
    <div className="vysiongids-opening-hours">
      <input type="hidden" name="hoursByDay" value={payload.json} readOnly />
      {days.map((day, index) => (
        <div key={day.day} className="vysiongids-opening-hours-day">
          <div className="vysiongids-opening-hours-day-head">
            <span className="vysiongids-opening-hours-day-label">{DAY_LABEL[day.day]}</span>
            <label className="vysiongids-opening-hours-closed">
              <input
                type="checkbox"
                checked={day.closed}
                onChange={(e) => updateDay(index, { closed: e.target.checked })}
              />
              Gesloten
            </label>
          </div>
          {!day.closed ? (
            <div className="vysiongids-opening-hours-shifts">
              <div className="vysiongids-opening-hours-shift">
                <span className="vysiongids-opening-hours-shift-label">Shift 1</span>
                <input
                  type="time"
                  required
                  value={day.shift1From}
                  onChange={(e) => updateDay(index, { shift1From: e.target.value })}
                  className="vysiongids-form-input vysiongids-opening-hours-time"
                />
                <span className="text-sm text-gray-500">tot</span>
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
                  onChange={(e) => updateDay(index, { shift2Enabled: e.target.checked })}
                />
                2e shift (van – tot)
              </label>
              {day.shift2Enabled ? (
                <div className="vysiongids-opening-hours-shift">
                  <span className="vysiongids-opening-hours-shift-label">Shift 2</span>
                  <input
                    type="time"
                    required={day.shift2Enabled}
                    value={day.shift2From}
                    onChange={(e) => updateDay(index, { shift2From: e.target.value })}
                    className="vysiongids-form-input vysiongids-opening-hours-time"
                  />
                  <span className="text-sm text-gray-500">tot</span>
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
        <p className="mt-2 text-xs text-gray-500">Gebruikt voor weergave en «Nu open» op de gids.</p>
      )}
    </div>
  )
}

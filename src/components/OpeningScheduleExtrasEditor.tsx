'use client'

import { useCallback, useMemo, useState } from 'react'
import type { ListingScheduleExtras, ListingAnnualLeaveRange } from '@/lib/listing-schedule-extras'
import { holidaysForOwnerForm } from '@/lib/listing-schedule-extras'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function isCompleteLeaveRange(r: ListingAnnualLeaveRange): boolean {
  const from = r.from.trim()
  const to = r.to.trim()
  return ISO_DATE.test(from) && ISO_DATE.test(to) && to >= from
}

type Props = {
  initial?: ListingScheduleExtras
}

function emptyRange(): ListingAnnualLeaveRange {
  return { from: '', to: '' }
}

export default function OpeningScheduleExtrasEditor({ initial }: Props) {
  const holidays = useMemo(() => holidaysForOwnerForm(), [])
  const [leaveRanges, setLeaveRanges] = useState<ListingAnnualLeaveRange[]>(() => {
    const rows = (initial?.annualLeave ?? []).filter(isCompleteLeaveRange)
    return rows.slice(0, 8)
  })
  const [holidayChoices, setHolidayChoices] = useState<Record<string, '' | 'open' | 'closed'>>(() => {
    const map: Record<string, '' | 'open' | 'closed'> = {}
    for (const h of holidays) {
      const c = initial?.holidays?.[h.date]
      map[h.date] = c === 'open' || c === 'closed' ? c : ''
    }
    return map
  })

  const json = useMemo(() => {
    const annualLeave = leaveRanges
      .map((r) => ({ from: r.from.trim(), to: r.to.trim() }))
      .filter((r) => r.from && r.to && r.to >= r.from)
    const holidaysOut: Record<string, 'open' | 'closed'> = {}
    for (const [date, choice] of Object.entries(holidayChoices)) {
      if (choice === 'open' || choice === 'closed') holidaysOut[date] = choice
    }
    const payload: ListingScheduleExtras = {}
    if (annualLeave.length) payload.annualLeave = annualLeave
    if (Object.keys(holidaysOut).length) payload.holidays = holidaysOut
    return JSON.stringify(payload)
  }, [leaveRanges, holidayChoices])

  const updateRange = useCallback((index: number, field: 'from' | 'to', value: string) => {
    setLeaveRanges((prev) => {
      const next = [...prev]
      next[index] = { ...next[index]!, [field]: value }
      return next
    })
  }, [])

  const addRange = useCallback(() => {
    setLeaveRanges((prev) => (prev.length >= 8 ? prev : [...prev, emptyRange()]))
  }, [])

  const removeRange = useCallback((index: number) => {
    setLeaveRanges((prev) => prev.filter((_, i) => i !== index))
  }, [])

  return (
    <fieldset className="vysiongids-surface-card mt-6 rounded-xl bg-gray-50/80 p-4 sm:p-5">
      <legend className="vysiongids-form-label px-1 text-base font-bold text-gray-900">Verlof &amp; feestdagen</legend>
      <p className="mt-1 text-sm text-gray-600">
        Optioneel. Gebruikt voor «Nu open» / «Opent …» op de gids (Europese tijd, België).
      </p>

      <input type="hidden" name="scheduleExtras" value={json} readOnly />

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-gray-900">Jaarlijks verlof</h3>
        <p className="mt-0.5 text-xs text-gray-500">Periodes waarop je zaak dicht is (bv. zomervakantie).</p>
        {leaveRanges.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">Nog geen verlofperiode — voeg er één toe wanneer je zaak dicht is.</p>
        ) : (
        <ul className="mt-3 space-y-3">
          {leaveRanges.map((range, index) => (
            <li key={index} className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600" htmlFor={`leave-from-${index}`}>
                  Van
                </label>
                <input
                  id={`leave-from-${index}`}
                  type="date"
                  value={range.from}
                  onChange={(e) => updateRange(index, 'from', e.target.value)}
                  className="vysiongids-form-input mt-0.5"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600" htmlFor={`leave-to-${index}`}>
                  Tot
                </label>
                <input
                  id={`leave-to-${index}`}
                  type="date"
                  value={range.to}
                  min={range.from || undefined}
                  onChange={(e) => updateRange(index, 'to', e.target.value)}
                  className="vysiongids-form-input mt-0.5"
                />
              </div>
              <button
                type="button"
                className="text-sm font-medium text-gray-600 hover:text-red-700"
                onClick={() => removeRange(index)}
              >
                Verwijder
              </button>
            </li>
          ))}
        </ul>
        )}
        {leaveRanges.length < 8 ? (
          <button type="button" className="mt-3 text-sm font-semibold text-accent hover:underline" onClick={addRange}>
            + Periode toevoegen
          </button>
        ) : null}
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-gray-900">Feestdagen</h3>
        <p className="mt-0.5 text-xs text-gray-500">
          «Normale uren» = openingsuren van die weekdag. Kies anders expliciet open of gesloten.
        </p>
        <ul className="mt-3 divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
          {holidays.map((h) => (
            <li key={h.date} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm">
              <span className="font-medium text-gray-800">
                {h.label}
                <span className="ml-2 font-normal text-gray-500">{h.date}</span>
              </span>
              <select
                className="vysiongids-form-input max-w-[11rem] py-1.5 text-sm"
                value={holidayChoices[h.date] ?? ''}
                onChange={(e) => {
                  const v = e.target.value as '' | 'open' | 'closed'
                  setHolidayChoices((prev) => ({ ...prev, [h.date]: v }))
                }}
                aria-label={`${h.label} ${h.date}`}
              >
                <option value="">Normale uren</option>
                <option value="open">Open</option>
                <option value="closed">Gesloten</option>
              </select>
            </li>
          ))}
        </ul>
      </div>
    </fieldset>
  )
}

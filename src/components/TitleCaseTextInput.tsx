'use client'

import { formatGidsTitleCase } from '@/lib/gids-text'
import type { InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement>

/** Tekstveld: bij verlaten van het veld automatisch hoofdletters per woord. */
export default function TitleCaseTextInput({ onBlur, ...props }: Props) {
  return (
    <input
      {...props}
      onBlur={(e) => {
        const formatted = formatGidsTitleCase(e.currentTarget.value)
        if (formatted !== e.currentTarget.value) {
          e.currentTarget.value = formatted
          e.currentTarget.dispatchEvent(new Event('input', { bubbles: true }))
        }
        onBlur?.(e)
      }}
    />
  )
}

export function applyTitleCaseFormFields(form: FormData, keys: string[]): void {
  for (const key of keys) {
    const raw = form.get(key)
    if (typeof raw !== 'string') continue
    form.set(key, formatGidsTitleCase(raw))
  }
}

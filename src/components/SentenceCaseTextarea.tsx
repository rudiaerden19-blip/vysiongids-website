'use client'

import { formatGidsSentenceText } from '@/lib/gids-text'
import { useCallback, useState, type KeyboardEvent, type TextareaHTMLAttributes } from 'react'

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'defaultValue'> & {
  defaultValue?: string
}

/** Meerdere regels: hoofdletter aan start, nieuwe regel en na zinspunt. */
export default function SentenceCaseTextarea({
  defaultValue,
  onBlur,
  onChange,
  onKeyUp,
  ...props
}: Props) {
  const [value, setValue] = useState(() => String(defaultValue ?? ''))

  const applyFormat = useCallback((raw: string) => {
    const formatted = formatGidsSentenceText(raw)
    setValue(formatted)
    return formatted
  }, [])

  return (
    <textarea
      {...props}
      value={value}
      autoCapitalize="sentences"
      autoCorrect="on"
      spellCheck={props.spellCheck ?? true}
      onChange={(e) => {
        setValue(e.target.value)
        onChange?.(e)
      }}
      onBlur={(e) => {
        applyFormat(e.target.value)
        onBlur?.(e)
      }}
      onKeyUp={(e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
          applyFormat(e.currentTarget.value)
        }
        onKeyUp?.(e)
      }}
    />
  )
}

export function applySentenceCaseFormFields(form: FormData, keys: string[]): void {
  for (const key of keys) {
    const raw = form.get(key)
    if (typeof raw !== 'string') continue
    form.set(key, formatGidsSentenceText(raw))
  }
}

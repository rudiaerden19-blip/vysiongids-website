'use client'

import { formatGidsTitleCase } from '@/lib/gids-text'
import {
  forwardRef,
  useCallback,
  useState,
  type InputHTMLAttributes,
  type KeyboardEvent,
} from 'react'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue'> & {
  defaultValue?: string
}

/** Tekstveld: hoofdletters per woord (spatie/enter, blur, en bij opslaan). */
const TitleCaseTextInput = forwardRef<HTMLInputElement, Props>(function TitleCaseTextInput(
  { defaultValue, onBlur, onChange, onKeyUp, ...props },
  ref,
) {
  const [value, setValue] = useState(() => String(defaultValue ?? ''))

  const applyFormat = useCallback((raw: string) => {
    const formatted = formatGidsTitleCase(raw)
    setValue(formatted)
    return formatted
  }, [])

  return (
    <input
      {...props}
      ref={ref}
      value={value}
      autoCapitalize="words"
      autoCorrect="off"
      spellCheck={props.spellCheck ?? false}
      onChange={(e) => {
        setValue(e.target.value)
        onChange?.(e)
      }}
      onBlur={(e) => {
        applyFormat(e.target.value)
        onBlur?.(e)
      }}
      onKeyUp={(e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === ' ' || e.key === 'Enter' || e.key === '-') {
          applyFormat(e.currentTarget.value)
        }
        onKeyUp?.(e)
      }}
    />
  )
})

export default TitleCaseTextInput

export function applyTitleCaseFormFields(form: FormData, keys: string[]): void {
  for (const key of keys) {
    const raw = form.get(key)
    if (typeof raw !== 'string') continue
    form.set(key, formatGidsTitleCase(raw))
  }
}

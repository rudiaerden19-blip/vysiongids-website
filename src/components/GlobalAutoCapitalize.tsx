'use client'

import { useEffect } from 'react'

import { setNativeInputValue } from '@/lib/dom-input-value'

/** Eerste letter (en na punt + spatie) automatisch hoofdletter — niet op e-mail/wachtwoord/numeriek. */
export function GlobalAutoCapitalize() {
  useEffect(() => {
    function handleInput(event: Event) {
      const raw = event.target
      if (raw == null || !(raw instanceof Element)) return
      if (!(raw instanceof HTMLInputElement) && !(raw instanceof HTMLTextAreaElement)) return
      const target = raw

      if (
        target.getAttribute('autocapitalize') === 'off' ||
        target.getAttribute('data-no-capitalize') === 'true'
      ) {
        return
      }

      const inputType = target.getAttribute('type')?.toLowerCase()
      if (
        inputType === 'email' ||
        inputType === 'password' ||
        inputType === 'url' ||
        inputType === 'number' ||
        inputType === 'checkbox' ||
        inputType === 'radio' ||
        inputType === 'range' ||
        inputType === 'color' ||
        inputType === 'file' ||
        inputType === 'hidden'
      ) {
        return
      }

      const inputMode = target.getAttribute('inputmode')?.toLowerCase()
      if (inputMode === 'decimal' || inputMode === 'numeric') {
        return
      }

      const value = target.value
      if (!value) return

      if (/^-?[\d\s.,]*$/.test(value)) {
        return
      }

      let newValue = value.charAt(0).toUpperCase() + value.slice(1)
      newValue = newValue.replace(/\. ([a-zà-ÿ])/g, (_match, letter: string) => `. ${letter.toUpperCase()}`)

      if (newValue !== value) {
        const cursorPos = target.selectionStart ?? 0
        setNativeInputValue(target, newValue)
        try {
          const pos = Math.min(cursorPos, newValue.length)
          target.setSelectionRange(pos, pos)
        } catch {
          /* noop */
        }
      }
    }

    document.addEventListener('input', handleInput, true)
    return () => document.removeEventListener('input', handleInput, true)
  }, [])

  return null
}

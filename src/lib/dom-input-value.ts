/**
 * Programmatisch een input/textarea vullen zodat React controlled state meeloopt.
 */

export function focusInputForProgrammaticEdit(
  el: HTMLInputElement | HTMLTextAreaElement,
): void {
  try {
    el.focus({ preventScroll: true })
  } catch {
    try {
      el.focus()
    } catch {
      /* noop */
    }
  }
}

type ValueTracking = { setValue: (v: string) => void }

function getValueTracker(el: HTMLInputElement | HTMLTextAreaElement): ValueTracking | null {
  const t = (el as unknown as { _valueTracker?: ValueTracking })._valueTracker
  return t && typeof t.setValue === 'function' ? t : null
}

function setValueViaNativePrototype(el: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const proto =
    el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set as
    | ((this: typeof el, v: string) => void)
    | undefined
  if (setter) {
    setter.call(el, value)
  } else {
    el.value = value
  }
}

export function setNativeInputValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const previous = el.value

  try {
    setValueViaNativePrototype(el, value)
  } catch {
    el.value = value
  }

  const tracker = getValueTracker(el)
  if (tracker) {
    try {
      tracker.setValue(previous)
    } catch {
      /* noop */
    }
  }

  try {
    el.dispatchEvent(new Event('input', { bubbles: true }))
  } catch {
    /* noop */
  }
}

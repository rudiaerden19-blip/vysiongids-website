/** Alleen publieke http(s)-URL's in de database — geen browser blob: preview. */
export function sanitizeMenuImageUrl(raw: string | null | undefined): string | null {
  const t = raw?.trim()
  if (!t) return null
  if (t.startsWith('blob:') || t.startsWith('data:')) return null
  if (!/^https?:\/\//i.test(t)) return null
  return t
}

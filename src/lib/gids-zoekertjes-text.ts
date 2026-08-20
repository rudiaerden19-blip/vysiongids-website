/** Eerste letter van de tekst (behoud leading whitespace niet). */
export function capitalizeFirstLetter(text: string): string {
  const trimmed = text.trimStart()
  if (!trimmed) return text
  const lead = text.slice(0, text.length - trimmed.length)
  return lead + trimmed.charAt(0).toLocaleUpperCase('nl-BE') + trimmed.slice(1)
}

/** Na punt/vraagteken/uitroepteken + spatie: hoofdletter (nl). */
export function capitalizeDutchSentences(text: string): string {
  const t = text.trim()
  if (!t) return text
  const lead = text.slice(0, text.length - t.length)
  const body = t.replace(/(^|[.!?…]\s+)([^\s])/gu, (match, prefix: string, ch: string) => {
    return prefix + ch.toLocaleUpperCase('nl-BE')
  })
  return lead + body
}

export function normalizeZoekertjeTitleInput(title: string): string {
  return capitalizeFirstLetter(title.trim()).slice(0, 60)
}

export function normalizeZoekertjeDescriptionInput(description: string): string {
  return capitalizeDutchSentences(description.trim()).slice(0, 4000)
}

export function normalizeZoekertjeOptionalLine(value: string): string {
  const t = value.trim()
  if (!t) return t
  return capitalizeFirstLetter(t)
}

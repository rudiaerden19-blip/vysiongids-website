/** Korte TTS na spraakzoeken — geen aantallen, geen zaaktype uit zoekterm. */
export function buildSearchResultsSpeechMessage(input: {
  count: number
  topName?: string
}): string {
  if (input.count === 0) {
    return 'Geen resultaat. Probeer een andere zoekterm.'
  }
  if (input.topName) {
    return `Ik vond ${input.topName}. Zeg waze er naartoe om te rijden.`
  }
  return 'Zoekresultaten staan klaar. Kies een zaak of zeg waze er naartoe.'
}

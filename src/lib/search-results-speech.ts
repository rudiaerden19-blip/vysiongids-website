/** Korte TTS na spraakzoeken — geen zaaktype of «in kebab» uit zoekterm. */
export function buildSearchResultsSpeechMessage(input: {
  count: number
  topName?: string
}): string {
  if (input.count === 0) {
    return 'Wij hebben geen zaken gevonden.'
  }
  if (input.count === 1 && input.topName) {
    return `Ik vond ${input.topName}. Zeg waze er naartoe om te rijden.`
  }
  if (input.count === 1) {
    return 'Wij hebben één zaak gevonden. Zeg waze er naartoe om te rijden.'
  }
  if (input.topName) {
    return `Wij hebben ${input.count} zaken gevonden. De dichtstbij is ${input.topName}. Zeg waze er naartoe.`
  }
  return `Wij hebben ${input.count} zaken gevonden.`
}

/** Korte TTS na spraakzoeken — geen zaaktype of «in kebab» uit zoekterm. */
export function buildSearchResultsSpeechMessage(input: { count: number }): string {
  if (input.count === 0) {
    return 'Wij hebben geen zaken gevonden.'
  }
  if (input.count === 1) {
    return 'Wij hebben één zaak gevonden.'
  }
  return `Wij hebben ${input.count} zaken gevonden.`
}

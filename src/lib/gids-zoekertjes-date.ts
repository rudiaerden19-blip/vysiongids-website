/** Datum voor «Geplaatst op dd/mm/jjjj» op zoekertjeskaarten. */
export function formatGidsZoekertjePlacedDate(iso: string): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return new Intl.DateTimeFormat('nl-BE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Europe/Brussels',
    }).format(d)
  } catch {
    return ''
  }
}

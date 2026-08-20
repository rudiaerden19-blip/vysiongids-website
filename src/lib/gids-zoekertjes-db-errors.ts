/** Supabase/Postgres melding wanneer gids_zoekertjes nog niet is aangemaakt. */
export function isMissingGidsZoekertjesTable(message: string | undefined): boolean {
  if (!message) return false
  const m = message.toLowerCase()
  if (!m.includes('gids_zoekertjes') && !m.includes('gids_zoekertje_photos')) return false
  return (
    m.includes('does not exist') ||
    m.includes('schema cache') ||
    m.includes('could not find') ||
    m.includes('relation') ||
    m.includes('42p01')
  )
}

export const GIDS_ZOEKERTJES_SETUP_SQL_HINT =
  'Voer in Supabase → SQL Editor het script supabase/migrations/015_gids_zoekertjes.sql uit (zelfde inhoud als supabase/ZOEKERTJES_TABLE.sql).'

export function friendlyGidsZoekertjesDbError(message: string | undefined): string {
  if (isMissingGidsZoekertjesTable(message)) {
    return `Zoekertjes-tabel ontbreekt in Supabase. ${GIDS_ZOEKERTJES_SETUP_SQL_HINT}`
  }
  return message?.trim() || 'Opslaan mislukt.'
}

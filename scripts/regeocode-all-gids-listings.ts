/**
 * Batch: alle gepubliceerde zaken opnieuw geocoden (straat + huisnummer).
 *
 *   npm run regeocode-listings
 *
 * Vereist .env.local met VYSIONGIDS Supabase service role.
 * ~1,1 s pauze per zaak (Nominatim fair use).
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnvLocal() {
  const path = resolve(process.cwd(), '.env.local')
  if (!existsSync(path)) return
  const text = readFileSync(path, 'utf8')
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!m) continue
    const key = m[1]
    let val = m[2].trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnvLocal()

const delayMs = Number(process.env.GEOCODE_BATCH_DELAY_MS ?? '1100')
const limitArg = process.argv.find((a) => a.startsWith('--limit='))
const maxListings = limitArg ? Number(limitArg.split('=')[1]) : undefined

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  const { fetchPublishedListingsFromDb } = await import('../src/lib/gids-listings-db')
  const { forceRefreshListingGeocode } = await import('../src/lib/gids-listing-geocode')

  const listings = (await fetchPublishedListingsFromDb()) ?? []
  const slice = maxListings && Number.isFinite(maxListings) ? listings.slice(0, maxListings) : listings

  console.log(`Regeocode batch: ${slice.length} gepubliceerde zaken (delay ${delayMs}ms)…`)

  let changed = 0
  let geocoded = 0
  let failed = 0

  for (let i = 0; i < slice.length; i++) {
    const listing = slice[i]!
    const result = await forceRefreshListingGeocode(listing)
    if (result.geocoded) geocoded++
    else failed++
    if (result.changed) changed++
    const tag = result.changed ? 'UPDATED' : result.geocoded ? 'ok' : 'FAIL'
    console.log(`[${i + 1}/${slice.length}] ${tag} ${listing.slug} — ${listing.address}, ${listing.postcode} ${listing.city}`)
    if (i < slice.length - 1) await sleep(delayMs)
  }

  console.log(`Klaar. Geocoded: ${geocoded}, bijgewerkt: ${changed}, mislukt: ${failed}.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

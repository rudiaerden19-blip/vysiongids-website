/**
 * Eenmalig: slechte (1-ster) reviews verwijderen voor opgegeven slugs.
 * Vereist .env.local met VYSIONGIDS_SUPABASE_* (service role).
 *
 *   node scripts/purge-gids-reviews.mjs frituur-aartselaar-aartselaar frituur-t-bintje-alken
 */
import { createClient } from '@supabase/supabase-js'
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

const url = process.env.NEXT_PUBLIC_VYSIONGIDS_SUPABASE_URL
const key = process.env.VYSIONGIDS_SUPABASE_SERVICE_ROLE_KEY
const slugs = process.argv.slice(2)
const maxRating = Number(process.env.PURGE_MAX_RATING ?? '1')

if (!url || !key) {
  console.error('Zet NEXT_PUBLIC_VYSIONGIDS_SUPABASE_URL en VYSIONGIDS_SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}
if (slugs.length === 0) {
  console.error('Geef minstens één slug op.')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

const { data: listings, error: listErr } = await supabase.from('gids_listings').select('id, slug').in('slug', slugs)
if (listErr) {
  console.error(listErr.message)
  process.exit(1)
}

const ids = (listings ?? []).map((l) => l.id)
console.log('Listings:', listings)

const { data: preview } = await supabase
  .from('gids_reviews')
  .select('id, rating, body, listing_id')
  .in('listing_id', ids)
  .lte('rating', maxRating)
console.log('Te verwijderen:', preview)

const { data: deleted, error: delErr } = await supabase
  .from('gids_reviews')
  .delete()
  .in('listing_id', ids)
  .lte('rating', maxRating)
  .select('id')

if (delErr) {
  console.error(delErr.message)
  process.exit(1)
}

console.log('Verwijderd:', deleted?.length ?? 0, 'review(s)')

/**
 * Genereert supabase/migrations/002_seed_demo_listings.sql vanuit data/listings.json
 * Run: node scripts/generate-seed-sql.mjs
 */
import { readFileSync, writeFileSync } from 'fs'
import { scryptSync } from 'crypto'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const listings = JSON.parse(readFileSync(join(root, 'data/listings.json'), 'utf8'))

function normalizeName(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function sqlStr(s) {
  if (s == null) return 'null'
  return `'${String(s).replace(/'/g, "''")}'`
}

function sqlJson(obj) {
  if (obj == null) return 'null'
  return `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`
}

const demoPinSalt = 'demo000000000001'
const demoPinHash = `scrypt:${demoPinSalt}:${scryptSync('000000', demoPinSalt, 32).toString('hex')}`

const lines = [
  '-- Demo-zaken uit listings.json (PIN demo: 000000 — alleen voor test/demo)',
  '',
]

for (const l of listings) {
  lines.push(`insert into public.gids_listings (`)
  lines.push(`  slug, name, name_normalized, pin_hash, type, city, postcode, province, address, order_url,`)
  lines.push(`  website, phone, email, opening_hours, closed_days, hours_by_day, amenities,`)
  lines.push(`  rating_avg, rating_count, delivery_time_min, delivery_time_max, delivery_fee_eur, min_order_eur,`)
  lines.push(`  pickup_enabled, delivery_enabled, lat, lng, status`)
  lines.push(`) values (`)
  lines.push(
    `  ${sqlStr(l.slug)}, ${sqlStr(l.name)}, ${sqlStr(normalizeName(l.name))}, ${sqlStr(demoPinHash)}, ${sqlStr(l.type)},`,
  )
  lines.push(
    `  ${sqlStr(l.city)}, ${sqlStr(l.postcode)}, ${sqlStr(l.province ?? null)}, ${sqlStr(l.address)}, ${sqlStr(l.orderUrl)},`,
  )
  lines.push(
    `  ${sqlStr(l.website ?? null)}, ${sqlStr(l.phone ?? null)}, ${sqlStr(l.email ?? null)}, ${sqlStr(l.openingHours)}, ${sqlStr(l.closedDays ?? null)},`,
  )
  lines.push(`  ${sqlJson(l.hoursByDay ?? null)}, ${sqlJson(l.amenities ?? null)},`)
  lines.push(
    `  ${l.ratingAvg}, ${l.ratingCount}, ${l.deliveryTimeMin}, ${l.deliveryTimeMax}, ${l.deliveryFeeEur ?? 'null'}, ${l.minOrderEur ?? 'null'},`,
  )
  lines.push(
    `  ${l.pickupEnabled}, ${l.deliveryEnabled}, ${l.lat ?? 'null'}, ${l.lng ?? 'null'}, 'published'`,
  )
  lines.push(`) on conflict (slug) do nothing;`)
  lines.push('')
  lines.push(
    `insert into public.gids_listing_photos (listing_id, sort_order, storage_path, public_url)`,
  )
  lines.push(
    `select id, 0, ${sqlStr(`${l.slug}/0.jpg`)}, ${sqlStr(l.photoUrl)} from public.gids_listings where slug = ${sqlStr(l.slug)}`,
  )
  lines.push(`on conflict (listing_id, sort_order) do nothing;`)
  lines.push('')
}

writeFileSync(join(root, 'supabase/migrations/002_seed_demo_listings.sql'), lines.join('\n'))
console.log('Wrote 002_seed_demo_listings.sql', `(${listings.length} listings)`)

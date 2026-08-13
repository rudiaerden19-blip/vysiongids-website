#!/usr/bin/env node
/**
 * CSV → data/listings.json
 * Kopieer data/listings.template.csv, vul rijen in, run:
 *   node scripts/import-listings-csv.mjs data/jouw-export.csv
 */
import fs from 'node:fs'
import path from 'node:path'

const csvPath = process.argv[2]
if (!csvPath) {
  console.error('Usage: node scripts/import-listings-csv.mjs <pad/naar.csv>')
  process.exit(1)
}

const raw = fs.readFileSync(csvPath, 'utf8')
const lines = raw.split(/\r?\n/).filter((l) => l.trim())
if (lines.length < 2) {
  console.error('CSV needs header + at least one row')
  process.exit(1)
}

const header = lines[0].split(';').map((h) => h.trim())
const rows = lines.slice(1)

function parseRow(line) {
  const cols = line.split(';')
  const row = {}
  header.forEach((key, i) => {
    row[key] = (cols[i] ?? '').trim()
  })
  return row
}

function slugify(name, city) {
  return `${name}-${city}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const listings = rows.map((line) => {
  const r = parseRow(line)
  const deliveryFee = r.deliveryFeeEur === '' || r.deliveryFeeEur === 'gratis' ? null : Number(r.deliveryFeeEur)
  return {
    slug: r.slug || slugify(r.name, r.city),
    name: r.name,
    type: r.type || 'frituur',
    city: r.city,
    postcode: r.postcode,
    address: r.address,
    orderUrl: r.orderUrl,
    photoUrl: r.photoUrl || '/images/placeholder-frituur.svg',
    ratingAvg: Number(r.ratingAvg || 4.5),
    ratingCount: Number(r.ratingCount || 0),
    deliveryTimeMin: Number(r.deliveryTimeMin || 20),
    deliveryTimeMax: Number(r.deliveryTimeMax || 40),
    deliveryFeeEur: Number.isFinite(deliveryFee) ? deliveryFee : null,
    minOrderEur: r.minOrderEur === '' ? null : Number(r.minOrderEur),
    pickupEnabled: r.pickupEnabled !== '0' && r.pickupEnabled !== 'false',
    deliveryEnabled: r.deliveryEnabled !== '0' && r.deliveryEnabled !== 'false',
    ...(r.closedDays ? { closedDays: r.closedDays } : {}),
  }
})

const out = path.join(process.cwd(), 'data/listings.json')
fs.writeFileSync(out, JSON.stringify(listings, null, 2) + '\n')
console.log(`Wrote ${listings.length} listings to ${out}`)

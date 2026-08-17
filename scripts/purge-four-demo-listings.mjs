#!/usr/bin/env node
/**
 * Verwijder 4 demo-listings uit Supabase (productie).
 * Vereist: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 *   node scripts/purge-four-demo-listings.mjs
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const envPath = resolve(root, '.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const url = process.env.NEXT_PUBLIC_VYSIONGIDS_SUPABASE_URL
const key = process.env.VYSIONGIDS_SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_VYSIONGIDS_SUPABASE_URL and VYSIONGIDS_SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const SLUGS = [
  'frituur-nolim-pelt',
  'demo-kebab-genk',
  'demo-pizza-hasselt',
  'demo-frituur-neerpelt',
]

const supabase = createClient(url, key)
const { data, error } = await supabase.from('gids_listings').delete().in('slug', SLUGS).select('slug')
if (error) {
  console.error(error.message)
  process.exit(1)
}
console.log('Deleted:', (data ?? []).map((r) => r.slug).join(', ') || '(geen rijen — al weg?)')

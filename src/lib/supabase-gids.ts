import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/** Alleen Vysiongids Supabase — geen Vysion Order / kassa env vars. */

export type GidsSupabasePublic = SupabaseClient

const globalGidsSupabase = globalThis as typeof globalThis & {
  __gidsSupabasePublic?: GidsSupabasePublic | null
  __gidsSupabaseAdmin?: SupabaseClient | null
}

export function isGidsSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VYSIONGIDS_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_VYSIONGIDS_SUPABASE_ANON_KEY,
  )
}

/** Browser / server components — anon, RLS. */
export function createGidsSupabasePublic(): GidsSupabasePublic | null {
  if (globalGidsSupabase.__gidsSupabasePublic !== undefined) {
    return globalGidsSupabase.__gidsSupabasePublic
  }
  const url = process.env.NEXT_PUBLIC_VYSIONGIDS_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_VYSIONGIDS_SUPABASE_ANON_KEY
  if (!url || !anon) {
    globalGidsSupabase.__gidsSupabasePublic = null
    return null
  }
  globalGidsSupabase.__gidsSupabasePublic = createClient(url, anon)
  return globalGidsSupabase.__gidsSupabasePublic
}

/** Server-only (API routes). */
export function createGidsSupabaseAdmin(): SupabaseClient | null {
  if (globalGidsSupabase.__gidsSupabaseAdmin !== undefined) {
    return globalGidsSupabase.__gidsSupabaseAdmin
  }
  const url = process.env.NEXT_PUBLIC_VYSIONGIDS_SUPABASE_URL
  const service = process.env.VYSIONGIDS_SUPABASE_SERVICE_ROLE_KEY
  if (!url || !service) {
    globalGidsSupabase.__gidsSupabaseAdmin = null
    return null
  }
  globalGidsSupabase.__gidsSupabaseAdmin = createClient(url, service, { auth: { persistSession: false } })
  return globalGidsSupabase.__gidsSupabaseAdmin
}

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/** Alleen Vysiongids Supabase — geen Vysion Order / kassa env vars. */

export type GidsSupabasePublic = SupabaseClient

export function isGidsSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VYSIONGIDS_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_VYSIONGIDS_SUPABASE_ANON_KEY,
  )
}

/** Browser / server components — anon, RLS. */
export function createGidsSupabasePublic(): GidsSupabasePublic | null {
  const url = process.env.NEXT_PUBLIC_VYSIONGIDS_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_VYSIONGIDS_SUPABASE_ANON_KEY
  if (!url || !anon) return null
  return createClient(url, anon)
}

/** Server-only (API routes). */
export function createGidsSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_VYSIONGIDS_SUPABASE_URL
  const service = process.env.VYSIONGIDS_SUPABASE_SERVICE_ROLE_KEY
  if (!url || !service) return null
  return createClient(url, service, { auth: { persistSession: false } })
}

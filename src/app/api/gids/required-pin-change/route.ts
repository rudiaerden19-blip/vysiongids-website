import { NextResponse } from 'next/server'
import { createGidsSupabaseAdmin } from '@/lib/supabase-gids'
import {
  GIDS_DEFAULT_STARTER_PIN,
  hashGidsPin,
  isGidsDefaultStarterPin,
  isValidGidsPin,
} from '@/lib/gids-pin'
import { readGidsOwnerSession } from '@/lib/gids-session'

export async function POST(req: Request) {
  const session = await readGidsOwnerSession()
  if (!session) {
    return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })
  }

  let body: { newPin?: string; confirmPin?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag.' }, { status: 400 })
  }

  const newPin = String(body.newPin ?? '').trim()
  const confirmPin = String(body.confirmPin ?? '').trim()

  if (!isValidGidsPin(newPin)) {
    return NextResponse.json({ error: 'Kies een PIN van 6 cijfers.' }, { status: 400 })
  }
  if (newPin !== confirmPin) {
    return NextResponse.json({ error: 'PIN en bevestiging komen niet overeen.' }, { status: 400 })
  }
  if (isGidsDefaultStarterPin(newPin)) {
    return NextResponse.json(
      { error: `Kies een andere PIN dan ${GIDS_DEFAULT_STARTER_PIN}.` },
      { status: 400 },
    )
  }

  const admin = createGidsSupabaseAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Database niet geconfigureerd.' }, { status: 503 })
  }

  const { data: row, error: readErr } = await admin
    .from('gids_listings')
    .select('id, pin_must_change')
    .eq('id', session.listingId)
    .maybeSingle()

  if (readErr || !row) {
    return NextResponse.json({ error: 'Zaak niet gevonden.' }, { status: 404 })
  }
  if (!row.pin_must_change) {
    return NextResponse.json({ error: 'PIN-wijziging is niet verplicht.' }, { status: 400 })
  }

  const { error: updateErr } = await admin
    .from('gids_listings')
    .update({ pin_hash: hashGidsPin(newPin), pin_must_change: false })
    .eq('id', session.listingId)

  if (updateErr) {
    console.error('[gids required-pin-change]', updateErr.message)
    return NextResponse.json({ error: 'Opslaan mislukt. Probeer later opnieuw.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

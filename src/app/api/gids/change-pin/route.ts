import { NextResponse } from 'next/server'
import { createGidsSupabaseAdmin } from '@/lib/supabase-gids'
import {
  GIDS_DEFAULT_STARTER_PIN,
  hashGidsPin,
  isGidsDefaultStarterPin,
  isValidGidsPin,
  verifyGidsPin,
} from '@/lib/gids-pin'
import { readGidsOwnerSession } from '@/lib/gids-session'

export async function POST(req: Request) {
  const session = await readGidsOwnerSession()
  if (!session) {
    return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })
  }

  let body: { currentPin?: string; newPin?: string; confirmPin?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag.' }, { status: 400 })
  }

  const currentPin = String(body.currentPin ?? '').trim()
  const newPin = String(body.newPin ?? '').trim()
  const confirmPin = String(body.confirmPin ?? '').trim()

  if (!isValidGidsPin(currentPin)) {
    return NextResponse.json({ error: 'Vul je huidige PIN in (6 cijfers).' }, { status: 400 })
  }
  if (!isValidGidsPin(newPin)) {
    return NextResponse.json({ error: 'Kies een nieuwe PIN van 6 cijfers.' }, { status: 400 })
  }
  if (newPin !== confirmPin) {
    return NextResponse.json({ error: 'Nieuwe PIN en bevestiging komen niet overeen.' }, { status: 400 })
  }
  if (currentPin === newPin) {
    return NextResponse.json({ error: 'Kies een andere PIN dan je huidige.' }, { status: 400 })
  }

  const admin = createGidsSupabaseAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Database niet geconfigureerd.' }, { status: 503 })
  }

  const { data: row, error: readErr } = await admin
    .from('gids_listings')
    .select('id, pin_hash')
    .eq('id', session.listingId)
    .maybeSingle()

  if (readErr || !row?.pin_hash) {
    return NextResponse.json({ error: 'Zaak niet gevonden.' }, { status: 404 })
  }

  if (!verifyGidsPin(currentPin, row.pin_hash)) {
    return NextResponse.json({ error: 'Huidige PIN is onjuist.' }, { status: 401 })
  }

  if (isGidsDefaultStarterPin(newPin)) {
    return NextResponse.json(
      { error: `Kies een andere PIN dan ${GIDS_DEFAULT_STARTER_PIN}.` },
      { status: 400 },
    )
  }

  const pinPatch: Record<string, unknown> = {
    pin_hash: hashGidsPin(newPin),
    pin_must_change: false,
  }
  let { error: updateErr } = await admin
    .from('gids_listings')
    .update(pinPatch)
    .eq('id', session.listingId)

  if (updateErr && /pin_must_change/i.test(updateErr.message)) {
    delete pinPatch.pin_must_change
    const retry = await admin.from('gids_listings').update(pinPatch).eq('id', session.listingId)
    updateErr = retry.error
  }

  if (updateErr) {
    console.error('[gids change-pin]', updateErr.message)
    return NextResponse.json({ error: 'Opslaan mislukt. Probeer later opnieuw.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

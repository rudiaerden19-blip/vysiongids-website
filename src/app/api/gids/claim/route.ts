import { NextResponse } from 'next/server'
import { createGidsSupabaseAdmin } from '@/lib/supabase-gids'
import { enforceRateLimit } from '@/lib/gids-rate-limit'
import { isGidsMailConfigured, sendListingClaimEmails } from '@/lib/gids-mail'

const WINDOW_MS = 60 * 60 * 1000
const MAX_PER_IP = 8

type ClaimBody = {
  slug?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  btwNumber?: string
  message?: string
  authorized?: boolean
}

function trimOptional(s: unknown, maxLen: number): string | null {
  const t = String(s ?? '').trim()
  if (!t) return null
  return t.slice(0, maxLen)
}

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, 'gids-listing-claim', WINDOW_MS, MAX_PER_IP)
  if (limited) return limited

  const admin = createGidsSupabaseAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Database niet geconfigureerd.' }, { status: 503 })
  }

  let body: ClaimBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag.' }, { status: 400 })
  }

  const slug = String(body.slug ?? '').trim()
  const contactName = String(body.contactName ?? '').trim()
  const contactEmail = String(body.contactEmail ?? '').trim().toLowerCase()
  const contactPhone = String(body.contactPhone ?? '').trim()
  const btwNumber = String(body.btwNumber ?? '').trim().slice(0, 32)
  const message = trimOptional(body.message, 2000)
  const authorized = body.authorized === true

  if (!slug) {
    return NextResponse.json({ error: 'Zaak ontbreekt.' }, { status: 400 })
  }
  if (contactName.length < 2) {
    return NextResponse.json({ error: 'Vul je naam in.' }, { status: 400 })
  }
  if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return NextResponse.json({ error: 'Vul een geldig e-mailadres in.' }, { status: 400 })
  }
  if (contactPhone.length < 6) {
    return NextResponse.json({ error: 'Vul een geldig telefoonnummer in.' }, { status: 400 })
  }
  if (btwNumber.length < 8) {
    return NextResponse.json({ error: 'Vul een geldig BTW-nummer in.' }, { status: 400 })
  }
  if (!authorized) {
    return NextResponse.json({ error: 'Bevestig dat je bevoegd bent om deze zaak te beheren.' }, { status: 400 })
  }

  const { data: listing, error: listingErr } = await admin
    .from('gids_listings')
    .select('id, slug, name, city, claimed_at, status')
    .eq('slug', slug)
    .maybeSingle()

  if (listingErr) {
    console.error('[gids claim]', listingErr.message)
    return NextResponse.json({ error: 'Kon zaak niet opzoeken.' }, { status: 500 })
  }
  if (!listing || listing.status !== 'published') {
    return NextResponse.json({ error: 'Zaak niet gevonden.' }, { status: 404 })
  }
  if (listing.claimed_at) {
    return NextResponse.json(
      { error: 'Deze zaak is al geclaimd. Log in met je zaaknaam en PIN, of neem contact op met Vysiongids.' },
      { status: 409 },
    )
  }

  const { data: pendingDup } = await admin
    .from('gids_listing_claim_requests')
    .select('id')
    .eq('listing_id', listing.id)
    .eq('contact_email', contactEmail)
    .eq('status', 'pending')
    .maybeSingle()

  if (pendingDup) {
    if (isGidsMailConfigured()) {
      try {
        await sendListingClaimEmails({
          listingName: listing.name,
          listingSlug: listing.slug,
          listingCity: listing.city ?? '',
          contactName,
          contactEmail,
          contactPhone,
          btwNumber,
          message,
          resubmit: true,
        })
      } catch (mailErr) {
        console.error('[gids claim mail duplicate]', mailErr)
      }
    }
    return NextResponse.json({ ok: true, duplicate: true })
  }

  const { data: insertedRow, error: insertErr } = await admin
    .from('gids_listing_claim_requests')
    .insert({
      listing_id: listing.id,
      contact_name: contactName,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      btw_number: btwNumber,
      message,
    })
    .select('id')
    .single()

  if (insertErr || !insertedRow) {
    console.error('[gids claim insert]', insertErr.message, insertErr.code)
    if (/gids_listing_claim_requests/i.test(insertErr.message)) {
      return NextResponse.json(
        { error: 'Claim-module nog niet actief in de database. Voer migratie 024 uit in Supabase.' },
        { status: 503 },
      )
    }
    return NextResponse.json({ error: 'Aanvraag kon niet worden opgeslagen. Probeer later opnieuw.' }, { status: 500 })
  }

  if (isGidsMailConfigured()) {
    try {
      await sendListingClaimEmails({
        listingName: listing.name,
        listingSlug: listing.slug,
        listingCity: listing.city ?? '',
        contactName,
        contactEmail,
        contactPhone,
        btwNumber,
        message,
      })
    } catch (mailErr) {
      console.error('[gids claim mail]', mailErr)
      await admin.from('gids_listing_claim_requests').delete().eq('id', insertedRow.id)
      return NextResponse.json(
        {
          error: 'Verzenden mislukt. Probeer later opnieuw of mail rechtstreeks naar info@vysionhoreca.com.',
        },
        { status: 503 },
      )
    }
  } else {
    console.warn(
      '[gids claim] ZOHO_EMAIL / ZOHO_PASSWORD missing — aanvraag opgeslagen zonder e-mailnotificatie',
    )
  }

  return NextResponse.json({ ok: true, listingName: listing.name })
}

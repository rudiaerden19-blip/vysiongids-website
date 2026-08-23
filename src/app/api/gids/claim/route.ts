import { NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { createGidsSupabaseAdmin } from '@/lib/supabase-gids'
import { enforceRateLimit } from '@/lib/gids-rate-limit'
import { isGidsMailConfigured, sendListingClaimActivatedEmails } from '@/lib/gids-mail'
import { listingAcceptsPublicClaim } from '@/lib/listing-claimable'
import { activateGidsListingFromClaim, newClaimOwnerPin } from '@/lib/gids-claim-activate'
import { GIDS_DEFAULT_STARTER_PIN, verifyGidsPin } from '@/lib/gids-pin'
import {
  GIDS_SESSION_COOKIE,
  gidsSessionCookieOptions,
  signGidsSession,
} from '@/lib/gids-session'

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

type ListingRow = {
  id: string
  slug: string
  name: string
  city: string | null
  claimed_at: string | null
  status: string
  pin_hash: string | null
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
    .select('id, slug, name, city, claimed_at, status, pin_hash')
    .eq('slug', slug)
    .maybeSingle()

  if (listingErr) {
    console.error('[gids claim]', listingErr.message)
    return NextResponse.json({ error: 'Kon zaak niet opzoeken.' }, { status: 500 })
  }
  if (!listing || listing.status !== 'published') {
    return NextResponse.json({ error: 'Zaak niet gevonden.' }, { status: 404 })
  }

  const row = listing as ListingRow

  if (!listingAcceptsPublicClaim({ claimed_at: row.claimed_at })) {
    return NextResponse.json(
      {
        error: 'Deze zaak is al geclaimd. Log in met je zaaknaam en PIN, of neem contact op met Vysiongids.',
      },
      { status: 409 },
    )
  }

  const mailPayloadBase = {
    listingName: row.name,
    listingSlug: row.slug,
    listingCity: row.city ?? '',
    contactName,
    contactEmail,
    contactPhone,
    btwNumber,
    message,
  }

  const { data: pendingDup } = await admin
    .from('gids_listing_claim_requests')
    .select('id')
    .eq('listing_id', row.id)
    .eq('contact_email', contactEmail)
    .eq('status', 'pending')
    .maybeSingle()

  let claimRequestId = pendingDup?.id as string | undefined
  let duplicate = Boolean(pendingDup)

  if (!claimRequestId) {
    const { data: insertedRow, error: insertErr } = await admin
      .from('gids_listing_claim_requests')
      .insert({
        listing_id: row.id,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        btw_number: btwNumber,
        message,
      })
      .select('id')
      .single()

    if (insertErr || !insertedRow) {
      console.error('[gids claim insert]', insertErr?.message, insertErr?.code)
      if (/gids_listing_claim_requests/i.test(insertErr?.message ?? '')) {
        return NextResponse.json(
          { error: 'Claim-module nog niet actief in de database. Voer migratie 024 uit in Supabase.' },
          { status: 503 },
        )
      }
      return NextResponse.json({ error: 'Aanvraag kon niet worden opgeslagen. Probeer later opnieuw.' }, { status: 500 })
    }
    claimRequestId = insertedRow.id as string
    duplicate = false
  }

  const existingHash = row.pin_hash?.trim() ?? ''
  const keepExistingPin = existingHash.length > 0
  const pin = keepExistingPin
    ? verifyGidsPin(GIDS_DEFAULT_STARTER_PIN, existingHash)
      ? GIDS_DEFAULT_STARTER_PIN
      : undefined
    : newClaimOwnerPin()

  const activated = await activateGidsListingFromClaim(admin, {
    listingId: row.id,
    contactEmail,
    contactPhone,
    pin: keepExistingPin ? undefined : pin,
  })

  if (!activated.ok) {
    console.error('[gids claim activate]', activated.reason, activated.message)
    return NextResponse.json(
      { error: 'Activatie mislukt. Neem contact op met Vysiongids — vermeld je zaaknaam.' },
      { status: 500 },
    )
  }

  try {
    revalidateTag('gids-listings', 'max')
    revalidatePath('/')
    revalidatePath('/zoeken')
    revalidatePath(`/zaak/${row.slug}`)
    revalidatePath('/intern/gids-beheer')
  } catch (revalidateErr) {
    console.error('[gids claim] revalidate', revalidateErr)
  }

  let confirmationSent = false
  const mailConfigured = isGidsMailConfigured()
  if (mailConfigured) {
    const sent = await sendListingClaimActivatedEmails({
      ...mailPayloadBase,
      pin,
      resubmit: duplicate,
    })
    confirmationSent = sent.applicantOk
    if (!sent.applicantOk) {
      console.warn('[gids claim] owner mail failed after activate — sessie + beheer blijven werken')
    }
    if (!sent.staffOk) {
      console.warn('[gids claim] staff notification failed after owner mail')
    }
  }

  const res = NextResponse.json({
    ok: true,
    activated: true,
    duplicate,
    listingName: row.name,
    mailConfigured,
    confirmationSent,
    redirectTo: '/beheer',
  })
  const token = signGidsSession(row.id)
  if (token) {
    res.cookies.set(GIDS_SESSION_COOKIE, token, gidsSessionCookieOptions())
  }
  return res
}

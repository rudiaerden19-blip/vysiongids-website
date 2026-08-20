import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getGidsOwnerListingIdFromCookies } from '@/lib/gids-session'
import { fetchListingRowByIdAdmin } from '@/lib/gids-listings-db'
import { resolveListingPremiumActive } from '@/lib/gids-premium'
import {
  gidsPremiumStripeConfigured,
  gidsPremiumUnitAmountCents,
  siteOriginFromRequest,
} from '@/lib/gids-premium-stripe'

export const runtime = 'nodejs'

type Body = {
  contactName?: string
  zaakName?: string
  phone?: string
  email?: string
}

export async function POST(req: Request) {
  if (!gidsPremiumStripeConfigured()) {
    return NextResponse.json({ error: 'Online betalen is nog niet geconfigureerd.' }, { status: 503 })
  }

  const listingId = await getGidsOwnerListingIdFromCookies()
  if (!listingId) {
    return NextResponse.json(
      { error: 'Log in met je zaak (Login) om premium te nemen.' },
      { status: 401 },
    )
  }

  const row = await fetchListingRowByIdAdmin(listingId)
  if (!row) {
    return NextResponse.json({ error: 'Zaak niet gevonden.' }, { status: 404 })
  }

  if (resolveListingPremiumActive(row)) {
    return NextResponse.json({ error: 'Je bent al premium-lid.' }, { status: 400 })
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag.' }, { status: 400 })
  }

  const contactName = (body.contactName ?? '').trim()
  const zaakName = (body.zaakName ?? row.name).trim()
  const phone = (body.phone ?? '').trim()
  const email = (body.email ?? '').trim().toLowerCase()

  if (!contactName || contactName.length < 2) {
    return NextResponse.json({ error: 'Vul je naam in.' }, { status: 400 })
  }
  if (!zaakName || zaakName.length < 2) {
    return NextResponse.json({ error: 'Vul de naam van je zaak in.' }, { status: 400 })
  }
  if (!phone || phone.length < 6) {
    return NextResponse.json({ error: 'Vul een geldig telefoonnummer in.' }, { status: 400 })
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Vul een geldig e-mailadres in.' }, { status: 400 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const origin = siteOriginFromRequest(req)
  const amount = gidsPremiumUnitAmountCents()

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'bancontact'],
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: amount,
            product_data: {
              name: 'Vysiongids Premium (1 jaar)',
              description: `Vacatures & zoekertjes — ${zaakName}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        kind: 'gids_premium_yearly',
        listing_id: listingId,
        listing_slug: row.slug,
        contact_name: contactName.slice(0, 200),
        zaak_name: zaakName.slice(0, 200),
        contact_phone: phone.slice(0, 40),
        contact_email: email.slice(0, 200),
      },
      success_url: `${origin}/beheer?premium=success`,
      cancel_url: `${origin}/beheer?premium=cancel`,
    })

    if (!session.url) {
      return NextResponse.json({ error: 'Stripe-sessie kon niet starten.' }, { status: 500 })
    }

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    const message =
      err instanceof Stripe.errors.StripeError
        ? err.message
        : err instanceof Error
          ? err.message
          : 'Onbekende Stripe-fout'
    console.error('[gids-premium checkout]', message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

import { NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import Stripe from 'stripe'
import { activateGidsListingPremiumByIdAdmin } from '@/lib/gids-premium-db'
import { gidsPremiumUnitAmountCents } from '@/lib/gids-premium-stripe'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim()
  const webhookSecret = process.env.STRIPE_GIDS_PREMIUM_WEBHOOK_SECRET?.trim()

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook niet geconfigureerd.' }, { status: 503 })
  }

  const stripe = new Stripe(stripeKey)
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  if (!sig) {
    return NextResponse.json({ error: 'Geen signature.' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Ongeldige signature'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    if (session.metadata?.kind !== 'gids_premium_yearly') {
      return NextResponse.json({ received: true })
    }

    if (session.payment_status && session.payment_status !== 'paid') {
      return NextResponse.json({ received: true })
    }

    const expectedCents = gidsPremiumUnitAmountCents()
    if (session.amount_total != null && session.amount_total < expectedCents) {
      console.error('[gids-premium webhook] amount mismatch', session.amount_total, expectedCents)
      return NextResponse.json({ error: 'Onjuist bedrag.' }, { status: 400 })
    }

    const listingId = session.metadata.listing_id
    const slug = session.metadata.listing_slug
    if (!listingId) {
      return NextResponse.json({ error: 'Geen listing_id in metadata.' }, { status: 400 })
    }

    const activated = await activateGidsListingPremiumByIdAdmin(listingId)
    if (!activated.ok) {
      console.error('[gids-premium webhook]', activated.error)
      return NextResponse.json({ error: activated.error }, { status: 500 })
    }

    revalidateTag('gids-listings', 'max')
    revalidatePath('/')
    if (slug) {
      revalidatePath(`/zaak/${slug}`)
    }
  }

  return NextResponse.json({ received: true })
}

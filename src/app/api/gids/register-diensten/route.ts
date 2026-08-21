import { NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import Stripe from 'stripe'
import { hashGidsPin } from '@/lib/gids-pin'
import { normalizeGidsBusinessName, slugifyListing } from '@/lib/gids-text'
import { fetchListingByNormalizedNameAdmin } from '@/lib/gids-listings-db'
import { createGidsSupabaseAdmin } from '@/lib/supabase-gids'
import { parseGidsDienstenFormData } from '@/lib/gids-diensten-form-server'
import { buildGidsDienstenInsertRow } from '@/lib/gids-diensten-db-write'
import { gidsListingSaveErrorMessage } from '@/lib/gids-listing-db-write'
import { siteOriginFromRequest, uploadGidsListingPhoto, ensureGidsPhotosBucket } from '@/lib/gids-listing-photos-server'
import { geocodeListingAddress } from '@/lib/gids-listing-geocode'
import { enforceRateLimit } from '@/lib/gids-rate-limit'
import { grantDienstenMembershipDevByIdAdmin } from '@/lib/gids-diensten-db'
import { gidsDienstenStripeConfigured, gidsDienstenUnitAmountCents } from '@/lib/gids-diensten-stripe'

export const maxDuration = 60

const REGISTER_WINDOW_MS = 60 * 60 * 1000
const REGISTER_MAX_PER_IP = 5

export async function POST(req: Request) {
  try {
    return await handleRegisterDienstenPost(req)
  } catch (err) {
    console.error('[gids register-diensten] unhandled', err)
    return NextResponse.json({ error: 'Registratie mislukt door een serverfout.' }, { status: 500 })
  }
}

async function handleRegisterDienstenPost(req: Request) {
  const limited = enforceRateLimit(req, 'gids-register-diensten', REGISTER_WINDOW_MS, REGISTER_MAX_PER_IP)
  if (limited) return limited

  const admin = createGidsSupabaseAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Database niet geconfigureerd.' }, { status: 503 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Ongeldig formulier.' }, { status: 400 })
  }

  const parsed = await parseGidsDienstenFormData(form)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status })
  const d = parsed.data

  const bucketReady = await ensureGidsPhotosBucket(admin)
  if (!bucketReady.ok) {
    return NextResponse.json({ error: bucketReady.message }, { status: 503 })
  }

  const nameNormalized = normalizeGidsBusinessName(d.name)
  const existing = await fetchListingByNormalizedNameAdmin(nameNormalized)
  if (existing) {
    return NextResponse.json({ error: 'Deze bedrijfsnaam staat al in de gids.' }, { status: 409 })
  }

  let slug = slugifyListing(d.name, d.city)
  const { data: slugHit } = await admin.from('gids_listings').select('slug').eq('slug', slug).maybeSingle()
  if (slugHit) slug = `${slug}-${Date.now().toString(36).slice(-4)}`

  const pinHash = hashGidsPin(d.pin)
  const coords = await geocodeListingAddress({
    address: d.address,
    postcode: d.postcode,
    city: d.city,
  })

  const stripeReady = gidsDienstenStripeConfigured()
  const initialStatus = stripeReady ? 'hidden' : 'published'

  const { data: inserted, error: insertErr } = await admin
    .from('gids_listings')
    .insert(
      buildGidsDienstenInsertRow(d, {
        slug,
        nameNormalized,
        pinHash,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        status: initialStatus,
      }),
    )
    .select('id, slug')
    .single()

  if (insertErr || !inserted) {
    console.error('[gids register-diensten]', insertErr?.message, insertErr?.code)
    return NextResponse.json({ error: gidsListingSaveErrorMessage(insertErr?.message) }, { status: 500 })
  }

  const origin = siteOriginFromRequest(req)

  try {
    await Promise.all(
      d.photos.map(({ index, file }) => uploadGidsListingPhoto(admin, inserted.id, index, file, origin)),
    )
  } catch (uploadErr) {
    const message = uploadErr instanceof Error ? uploadErr.message : 'Onbekende uploadfout'
    await admin.from('gids_listings').delete().eq('id', inserted.id)
    return NextResponse.json({ error: `Foto upload mislukt. ${message}` }, { status: 500 })
  }

  if (!stripeReady) {
    await grantDienstenMembershipDevByIdAdmin(inserted.id)
    revalidateTag('gids-listings', 'max')
    revalidatePath('/diensten')
    return NextResponse.json({
      ok: true,
      slug: inserted.slug,
      url: `/diensten/${inserted.slug}`,
      photoCount: d.photos.length,
      paymentSkipped: true,
    })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const amount = gidsDienstenUnitAmountCents()
  const checkoutOrigin = siteOriginFromRequest(req)
  const contactEmail = d.email ?? undefined

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'bancontact'],
      mode: 'payment',
      customer_email: contactEmail,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: amount,
            product_data: {
              name: 'Vysiongids diensten & publiciteit (1 jaar)',
              description: d.name,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        kind: 'gids_diensten_yearly',
        listing_id: inserted.id,
        listing_slug: inserted.slug,
        contact_phone: d.phone.slice(0, 40),
      },
      success_url: `${checkoutOrigin}/diensten/aanmelden/bedankt?slug=${encodeURIComponent(inserted.slug)}`,
      cancel_url: `${checkoutOrigin}/diensten/aanmelden?betaling=geannuleerd`,
    })

    if (!session.url) {
      await admin.from('gids_listings').delete().eq('id', inserted.id)
      return NextResponse.json({ error: 'Betaling kon niet starten.' }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      slug: inserted.slug,
      checkoutUrl: session.url,
      photoCount: d.photos.length,
    })
  } catch (err: unknown) {
    await admin.from('gids_listings').delete().eq('id', inserted.id)
    const message = err instanceof Error ? err.message : 'Stripe-fout'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

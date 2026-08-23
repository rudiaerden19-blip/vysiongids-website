import nodemailer from 'nodemailer'
import { GIDS_CONTACT } from '@/lib/gids-contact'

export const GIDS_CLAIM_NOTIFY_EMAIL = GIDS_CONTACT.email

function resolveZohoEmail(): string {
  return (
    process.env.ZOHO_EMAIL?.trim() ||
    process.env.ZOHO_MAIL?.trim() ||
    process.env.ZOHO_USER?.trim() ||
    GIDS_CLAIM_NOTIFY_EMAIL
  )
}

/** Zoho app-wachtwoord: alle witruimte/newlines strippen (Vercel plakt vaak enters mee). */
function sanitizeZohoSecret(raw: string | undefined): string {
  if (!raw) return ''
  return raw.replace(/[\s\uFEFF\u200B]+/g, '')
}

function resolveZohoPassword(): string {
  return (
    sanitizeZohoSecret(process.env.ZOHO_PASSWORD) ||
    sanitizeZohoSecret(process.env.ZOHO_PASS) ||
    ''
  )
}

export function isGidsMailConfigured(): boolean {
  return Boolean(resolveZohoEmail() && resolveZohoPassword())
}

export type ListingClaimMailPayload = {
  listingName: string
  listingSlug: string
  listingCity: string
  contactName: string
  contactEmail: string
  contactPhone: string
  btwNumber: string | null
  message: string | null
  /** Eerdere pending aanvraag — zelfde e-mail opnieuw ingediend */
  resubmit?: boolean
}

export type ListingClaimActivatedMailPayload = ListingClaimMailPayload & {
  /** Weglaten als de bestaande staff-PIN (123456) behouden blijft. */
  pin?: string
}

function siteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_VYSIONGIDS_SITE_URL?.trim() || 'https://www.vysiongids.be'
  return raw.replace(/\/$/, '')
}

function createZohoTransporter() {
  const user = resolveZohoEmail()
  const pass = resolveZohoPassword()
  if (!user || !pass) {
    throw new Error('ZOHO_EMAIL / ZOHO_PASSWORD niet geconfigureerd')
  }
  return nodemailer.createTransport({
    host: 'smtp.zoho.eu',
    port: 465,
    secure: true,
    auth: { user, pass },
  })
}

export async function sendListingClaimNotificationEmail(payload: ListingClaimMailPayload): Promise<void> {
  const user = resolveZohoEmail()
  const pass = resolveZohoPassword()
  if (!user || !pass) {
    throw new Error('ZOHO_EMAIL / ZOHO_PASSWORD niet geconfigureerd')
  }

  const zaakUrl = `${siteOrigin()}/zaak/${encodeURIComponent(payload.listingSlug)}`
  const subjectPrefix = payload.resubmit ? 'Herinnering — ' : ''
  const subject = `${subjectPrefix}Vysiongids claim: ${payload.listingName} (${payload.listingCity})`

  const lines = [
    payload.resubmit ? 'Opnieuw ingediende claim-aanvraag (stond al pending)' : 'Nieuwe claim-aanvraag op Vysiongids',
    '',
    `Zaak: ${payload.listingName}`,
    `Slug: ${payload.listingSlug}`,
    `Stad: ${payload.listingCity}`,
    `Pagina: ${zaakUrl}`,
    '',
    `Contact: ${payload.contactName}`,
    `E-mail: ${payload.contactEmail}`,
    `Telefoon: ${payload.contactPhone}`,
    payload.btwNumber ? `BTW: ${payload.btwNumber}` : 'BTW: —',
    payload.message ? `Extra info: ${payload.message}` : 'Extra info: —',
    '',
    'Actie: geen — claim is automatisch geactiveerd; eigenaar ontving PIN per e-mail.',
  ]

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 20px; color: #111;">
      <h2 style="color: #0e5d82; margin: 0 0 16px;">${payload.resubmit ? 'Claim opnieuw — auto-geactiveerd' : 'Claim auto-geactiveerd'}</h2>
      <p style="margin: 0 0 12px;"><strong>Zaak:</strong> ${escapeHtml(payload.listingName)}</p>
      <p style="margin: 0 0 12px;"><strong>Stad:</strong> ${escapeHtml(payload.listingCity)}</p>
      <p style="margin: 0 0 16px;"><a href="${escapeHtml(zaakUrl)}">${escapeHtml(zaakUrl)}</a></p>
      <table style="border-collapse: collapse; width: 100%; font-size: 15px;">
        <tr><td style="padding: 6px 12px 6px 0; color: #6b7280;">Contact</td><td>${escapeHtml(payload.contactName)}</td></tr>
        <tr><td style="padding: 6px 12px 6px 0; color: #6b7280;">E-mail</td><td><a href="mailto:${escapeHtml(payload.contactEmail)}">${escapeHtml(payload.contactEmail)}</a></td></tr>
        <tr><td style="padding: 6px 12px 6px 0; color: #6b7280;">Telefoon</td><td>${escapeHtml(payload.contactPhone)}</td></tr>
        <tr><td style="padding: 6px 12px 6px 0; color: #6b7280;">BTW</td><td>${escapeHtml(payload.btwNumber || '—')}</td></tr>
        <tr><td style="padding: 6px 12px 6px 0; color: #6b7280; vertical-align: top;">Extra</td><td>${escapeHtml(payload.message || '—')}</td></tr>
      </table>
    </div>
  `

  const transporter = createZohoTransporter()

  await transporter.sendMail({
    from: `"Vysiongids" <${user}>`,
    to: GIDS_CLAIM_NOTIFY_EMAIL,
    replyTo: payload.contactEmail,
    subject,
    text: lines.join('\n'),
    html,
  })
}

/** Na self-service claim: PIN + inloggen (direct actief). */
export async function sendListingClaimActivatedOwnerEmail(
  payload: ListingClaimActivatedMailPayload,
): Promise<void> {
  const user = resolveZohoEmail()
  const pass = resolveZohoPassword()
  if (!user || !pass) {
    throw new Error('ZOHO_EMAIL / ZOHO_PASSWORD niet geconfigureerd')
  }

  const loginUrl = `${siteOrigin()}/login`
  const beheerUrl = `${siteOrigin()}/beheer`
  const zaakUrl = `${siteOrigin()}/zaak/${encodeURIComponent(payload.listingSlug)}`
  const subject = `Vysiongids — je zaak ${payload.listingName} is geactiveerd`

  const text = [
    `Hallo ${payload.contactName},`,
    '',
    `Je claim voor ${payload.listingName} is goedgekeurd. Je kan meteen je zaak beheren.`,
    '',
    `Zaaknaam (exact zo in de gids): ${payload.listingName}`,
    payload.pin
      ? `PIN (6 cijfers): ${payload.pin}`
      : 'PIN: dezelfde 6 cijfers als bij plaatsing in de gids (meestal 123456). Wijzig die meteen in beheer.',
    '',
    `Beheer: ${beheerUrl}`,
    `Inloggen: ${loginUrl}`,
    `Je publieke pagina: ${zaakUrl}`,
    '',
    'Wijzig je PIN in beheer (veiligheid).',
    '',
    `Vragen? ${GIDS_CONTACT.email} · ${GIDS_CONTACT.phoneDisplay}`,
  ].join('\n')

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 20px; color: #111;">
      <h2 style="color: #0e5d82; margin: 0 0 16px;">Je zaak is geactiveerd</h2>
      <p style="margin: 0 0 16px; line-height: 1.5;">Hallo ${escapeHtml(payload.contactName)}, je claim voor <strong>${escapeHtml(payload.listingName)}</strong> is goedgekeurd. Je kan meteen je zaak beheren.</p>
      <p style="margin: 0 0 8px;"><strong>Zaaknaam:</strong> ${escapeHtml(payload.listingName)}</p>
      <p style="margin: 0 0 16px; font-size: 18px;"><strong>PIN:</strong> ${
        payload.pin
          ? `<code style="background:#f3f4f6;padding:4px 8px;border-radius:4px;">${escapeHtml(payload.pin)}</code>`
          : 'dezelfde code als bij plaatsing in de gids (meestal 123456). Wijzig die in beheer.'
      }</p>
      <p style="margin: 0 0 12px;"><a href="${escapeHtml(beheerUrl)}">Beheer</a> · <a href="${escapeHtml(loginUrl)}">Inloggen</a></p>
      <p style="margin: 0 0 16px;"><a href="${escapeHtml(zaakUrl)}">${escapeHtml(zaakUrl)}</a></p>
      <p style="margin: 0; color: #6b7280; font-size: 14px;">Wijzig je PIN in beheer.</p>
    </div>
  `

  const transporter = createZohoTransporter()
  await transporter.sendMail({
    from: `"Vysiongids" <${user}>`,
    to: payload.contactEmail,
    replyTo: GIDS_CONTACT.email,
    subject,
    text,
    html,
  })
}

export async function sendListingClaimActivatedEmails(
  payload: ListingClaimActivatedMailPayload,
): Promise<{ staffOk: boolean; applicantOk: boolean }> {
  let applicantOk = false
  let staffOk = false
  try {
    await sendListingClaimActivatedOwnerEmail(payload)
    applicantOk = true
  } catch (err) {
    console.error('[gids claim activated mail owner]', err)
  }
  try {
    await sendListingClaimNotificationEmail({ ...payload, resubmit: payload.resubmit })
    staffOk = true
  } catch (err) {
    console.error('[gids claim activated mail staff]', err)
  }
  return { staffOk, applicantOk }
}

/** @deprecated Alleen fallback; claim gebruikt sendListingClaimActivatedEmails. */
export async function sendListingClaimApplicantConfirmationEmail(
  payload: ListingClaimMailPayload,
): Promise<void> {
  const user = resolveZohoEmail()
  if (!user) {
    throw new Error('ZOHO_EMAIL / ZOHO_PASSWORD niet geconfigureerd')
  }

  const zaakUrl = `${siteOrigin()}/zaak/${encodeURIComponent(payload.listingSlug)}`
  const subject = payload.resubmit
    ? `Vysiongids — je claim voor ${payload.listingName} staat nog open`
    : `Vysiongids — aanvraag ontvangen voor ${payload.listingName}`

  const intro = payload.resubmit
    ? `We hebben je gegevens opnieuw ontvangen. Je claim voor ${payload.listingName} staat al in behandeling.`
    : `Bedankt ${payload.contactName}, we hebben je claim-aanvraag voor ${payload.listingName} ontvangen.`

  const text = [
    intro,
    '',
    `Zaak: ${payload.listingName}`,
    `Link: ${zaakUrl}`,
    '',
    'Vysiongids neemt binnen enkele werkdagen contact met je op via e-mail of telefoon om je login (PIN) te activeren.',
    '',
    `Vragen? ${GIDS_CONTACT.email} · ${GIDS_CONTACT.phoneDisplay}`,
  ].join('\n')

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 20px; color: #111;">
      <h2 style="color: #0e5d82; margin: 0 0 16px;">${payload.resubmit ? 'Aanvraag staat al open' : 'Aanvraag ontvangen'}</h2>
      <p style="margin: 0 0 16px; line-height: 1.5;">${escapeHtml(intro)}</p>
      <p style="margin: 0 0 8px;"><strong>Zaak:</strong> ${escapeHtml(payload.listingName)}</p>
      <p style="margin: 0 0 16px;"><a href="${escapeHtml(zaakUrl)}">${escapeHtml(zaakUrl)}</a></p>
      <p style="margin: 0 0 16px; line-height: 1.5;">Vysiongids neemt binnen enkele werkdagen contact met je op om je login (PIN) te activeren.</p>
      <p style="margin: 0; color: #6b7280; font-size: 14px;">Vragen? <a href="mailto:${escapeHtml(GIDS_CONTACT.email)}">${escapeHtml(GIDS_CONTACT.email)}</a></p>
    </div>
  `

  const transporter = createZohoTransporter()

  await transporter.sendMail({
    from: `"Vysiongids" <${user}>`,
    to: payload.contactEmail,
    replyTo: GIDS_CONTACT.email,
    subject,
    text,
    html,
  })
}

export async function sendListingClaimEmails(
  payload: ListingClaimMailPayload,
): Promise<{ staffOk: boolean; applicantOk: boolean }> {
  let applicantOk = false
  let staffOk = false
  try {
    await sendListingClaimApplicantConfirmationEmail(payload)
    applicantOk = true
  } catch (err) {
    console.error('[gids claim mail applicant]', err)
  }
  try {
    await sendListingClaimNotificationEmail(payload)
    staffOk = true
  } catch (err) {
    console.error('[gids claim mail staff]', err)
  }
  return { staffOk, applicantOk }
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

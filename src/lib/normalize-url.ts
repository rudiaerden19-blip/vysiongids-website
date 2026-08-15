/** Zet domein of pad om naar https-URL (accepteert invoer zonder protocol). */
export function normalizeHttpsUrl(raw: string): { ok: true; url: string } | { ok: false; message: string } {
  let value = raw.trim()
  if (!value) {
    return { ok: false, message: 'Vul een URL in.' }
  }

  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value.replace(/^\/+/, '')}`
  }

  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return { ok: false, message: 'Geen geldige URL.' }
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, message: 'Alleen http(s)-links zijn toegestaan.' }
  }

  if (!parsed.hostname || !parsed.hostname.includes('.')) {
    return { ok: false, message: 'Vul een volledig webadres in (bv. jouwzaak.be).' }
  }

  parsed.protocol = 'https:'
  const normalized = parsed.toString().replace(/\/$/, '')
  return { ok: true, url: normalized }
}

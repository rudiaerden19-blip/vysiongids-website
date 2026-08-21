import { NextResponse } from 'next/server'
import { getListingsForVoiceAction } from '@/lib/listings'
import { buildVoiceNameHints } from '@/lib/voice-search-transcript-fix'

export const revalidate = 300

export async function GET() {
  const listings = await getListingsForVoiceAction()
  const hints = buildVoiceNameHints(listings)
  return NextResponse.json({ hints })
}

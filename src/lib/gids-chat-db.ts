import { createGidsSupabaseAdmin } from '@/lib/supabase-gids'
import type {
  GidsChatMessage,
  GidsChatThreadDetail,
  GidsChatThreadSummary,
} from '@/lib/gids-chat-types'

type ThreadRow = {
  id: string
  context_type: string
  context_id: string
  seller_listing_id: string
  buyer_listing_id: string
  status: string
  last_message_at: string
  created_at: string
}

type MessageRow = {
  id: string
  thread_id: string
  sender_listing_id: string
  body: string
  created_at: string
}

type ListingBrief = { id: string; name: string; city: string; slug: string }

function isMissingChatTable(msg: string): boolean {
  return /gids_chat_threads|does not exist|schema cache/i.test(msg)
}

export function friendlyGidsChatDbError(message: string): string {
  if (isMissingChatTable(message)) {
    return 'Chat-tabellen ontbreken. Voer supabase/migrations/020_gids_chat.sql uit in Supabase.'
  }
  return message
}

async function fetchListingBriefsByIds(ids: string[]): Promise<Map<string, ListingBrief>> {
  const map = new Map<string, ListingBrief>()
  const unique = [...new Set(ids.filter(Boolean))]
  if (unique.length === 0) return map

  const admin = createGidsSupabaseAdmin()
  if (!admin) return map

  const { data } = await admin.from('gids_listings').select('id, name, city, slug').in('id', unique)
  for (const row of data ?? []) {
    const id = row.id as string
    map.set(id, {
      id,
      name: row.name as string,
      city: row.city as string,
      slug: row.slug as string,
    })
  }
  return map
}

async function fetchZoekertjeTitlesByIds(ids: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const unique = [...new Set(ids.filter(Boolean))]
  if (unique.length === 0) return map

  const admin = createGidsSupabaseAdmin()
  if (!admin) return map

  const { data } = await admin.from('gids_zoekertjes').select('id, title').in('id', unique)
  for (const row of data ?? []) {
    map.set(row.id as string, String(row.title ?? '').trim() || 'Zoekertje')
  }
  return map
}

async function fetchLastMessagesByThreadIds(threadIds: string[]): Promise<Map<string, { body: string; created_at: string }>> {
  const map = new Map<string, { body: string; created_at: string }>()
  if (threadIds.length === 0) return map

  const admin = createGidsSupabaseAdmin()
  if (!admin) return map

  const { data } = await admin
    .from('gids_chat_messages')
    .select('thread_id, body, created_at')
    .in('thread_id', threadIds)
    .order('created_at', { ascending: false })
    .limit(500)

  for (const row of data ?? []) {
    const tid = row.thread_id as string
    if (!map.has(tid)) {
      map.set(tid, { body: row.body as string, created_at: row.created_at as string })
    }
  }
  return map
}

async function fetchUnreadFlagsByThreadIds(
  threadIds: string[],
  myListingId: string,
): Promise<Map<string, boolean>> {
  const map = new Map<string, boolean>()
  for (const id of threadIds) map.set(id, false)
  if (threadIds.length === 0) return map

  const admin = createGidsSupabaseAdmin()
  if (!admin) return map

  const { data: readRows } = await admin
    .from('gids_chat_read_state')
    .select('thread_id, last_read_at')
    .eq('listing_id', myListingId)
    .in('thread_id', threadIds)

  const lastReadByThread = new Map<string, string>()
  for (const r of readRows ?? []) {
    lastReadByThread.set(r.thread_id as string, (r.last_read_at as string) ?? '1970-01-01T00:00:00Z')
  }

  const { data: messages } = await admin
    .from('gids_chat_messages')
    .select('thread_id, created_at, sender_listing_id')
    .in('thread_id', threadIds)
    .neq('sender_listing_id', myListingId)
    .order('created_at', { ascending: false })
    .limit(1000)

  for (const m of messages ?? []) {
    const tid = m.thread_id as string
    if (map.get(tid)) continue
    const lastRead = lastReadByThread.get(tid) ?? '1970-01-01T00:00:00Z'
    if (new Date(m.created_at as string).getTime() > new Date(lastRead).getTime()) {
      map.set(tid, true)
    }
  }
  return map
}

function contextTitleFromMaps(row: ThreadRow, zoekTitles: Map<string, string>, listings: Map<string, ListingBrief>): string {
  if (row.context_type === 'zoekertje') {
    return zoekTitles.get(row.context_id) ?? 'Zoekertje'
  }
  return listings.get(row.context_id)?.name ?? 'Leverancier'
}

async function mapThreadSummariesBatch(rows: ThreadRow[], myListingId: string): Promise<GidsChatThreadSummary[]> {
  if (rows.length === 0) return []

  const peerIds = rows.map((r) =>
    r.seller_listing_id === myListingId ? r.buyer_listing_id : r.seller_listing_id,
  )
  const zoekIds = rows.filter((r) => r.context_type === 'zoekertje').map((r) => r.context_id)
  const dienstenIds = rows.filter((r) => r.context_type === 'diensten_listing').map((r) => r.context_id)
  const threadIds = rows.map((r) => r.id)

  const listingIds = [...new Set([...peerIds, ...dienstenIds])]
  const [listings, zoekTitles, lastMsgs, unreadMap] = await Promise.all([
    fetchListingBriefsByIds(listingIds),
    fetchZoekertjeTitlesByIds(zoekIds),
    fetchLastMessagesByThreadIds(threadIds),
    fetchUnreadFlagsByThreadIds(threadIds, myListingId),
  ])

  const out: GidsChatThreadSummary[] = []
  for (const row of rows) {
    const peerId = row.seller_listing_id === myListingId ? row.buyer_listing_id : row.seller_listing_id
    const peer = listings.get(peerId)
    if (!peer) continue
    const last = lastMsgs.get(row.id)
    out.push({
      id: row.id,
      contextType: row.context_type as GidsChatThreadSummary['contextType'],
      contextId: row.context_id,
      sellerListingId: row.seller_listing_id,
      buyerListingId: row.buyer_listing_id,
      status: row.status === 'closed' ? 'closed' : 'open',
      lastMessageAt: row.last_message_at,
      createdAt: row.created_at,
      peerName: peer.name,
      peerCity: peer.city,
      peerSlug: peer.slug,
      contextTitle: contextTitleFromMaps(row, zoekTitles, listings),
      unread: unreadMap.get(row.id) ?? false,
      lastMessagePreview: last ? last.body.slice(0, 120) : null,
    })
  }
  return out
}

export async function findOrCreateGidsChatThreadAdmin(opts: {
  contextType: GidsChatThreadSummary['contextType']
  contextId: string
  sellerListingId: string
  buyerListingId: string
}): Promise<{ ok: true; threadId: string; created: boolean } | { ok: false; error: string }> {
  const admin = createGidsSupabaseAdmin()
  if (!admin) return { ok: false, error: 'Database niet geconfigureerd.' }

  const { data: existing } = await admin
    .from('gids_chat_threads')
    .select('id')
    .eq('context_type', opts.contextType)
    .eq('context_id', opts.contextId)
    .eq('buyer_listing_id', opts.buyerListingId)
    .maybeSingle()

  if (existing?.id) {
    return { ok: true, threadId: existing.id as string, created: false }
  }

  const { data: inserted, error } = await admin
    .from('gids_chat_threads')
    .insert({
      context_type: opts.contextType,
      context_id: opts.contextId,
      seller_listing_id: opts.sellerListingId,
      buyer_listing_id: opts.buyerListingId,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      const { data: again } = await admin
        .from('gids_chat_threads')
        .select('id')
        .eq('context_type', opts.contextType)
        .eq('context_id', opts.contextId)
        .eq('buyer_listing_id', opts.buyerListingId)
        .maybeSingle()
      if (again?.id) return { ok: true, threadId: again.id as string, created: false }
    }
    return { ok: false, error: friendlyGidsChatDbError(error.message) }
  }

  return { ok: true, threadId: inserted.id as string, created: true }
}

export async function listGidsChatThreadsForListingAdmin(
  listingId: string,
): Promise<{ ok: true; threads: GidsChatThreadSummary[] } | { ok: false; error: string }> {
  const admin = createGidsSupabaseAdmin()
  if (!admin) return { ok: false, error: 'Database niet geconfigureerd.' }

  const { data, error } = await admin
    .from('gids_chat_threads')
    .select('*')
    .or(`seller_listing_id.eq.${listingId},buyer_listing_id.eq.${listingId}`)
    .order('last_message_at', { ascending: false })
    .limit(100)

  if (error) return { ok: false, error: friendlyGidsChatDbError(error.message) }

  const threads = await mapThreadSummariesBatch((data ?? []) as ThreadRow[], listingId)
  return { ok: true, threads }
}

export async function fetchGidsChatThreadDetailAdmin(
  threadId: string,
  myListingId: string,
  opts?: { markRead?: boolean },
): Promise<{ ok: true; detail: GidsChatThreadDetail } | { ok: false; error: string; status: number }> {
  const admin = createGidsSupabaseAdmin()
  if (!admin) return { ok: false, error: 'Database niet geconfigureerd.', status: 503 }

  const { data: row, error } = await admin.from('gids_chat_threads').select('*').eq('id', threadId).maybeSingle()
  if (error) return { ok: false, error: friendlyGidsChatDbError(error.message), status: 500 }
  if (!row) return { ok: false, error: 'Gesprek niet gevonden.', status: 404 }

  const t = row as ThreadRow
  if (t.seller_listing_id !== myListingId && t.buyer_listing_id !== myListingId) {
    return { ok: false, error: 'Geen toegang tot dit gesprek.', status: 403 }
  }

  const peerId = t.seller_listing_id === myListingId ? t.buyer_listing_id : t.seller_listing_id

  const messagesPromise = admin
    .from('gids_chat_messages')
    .select('id, thread_id, sender_listing_id, body, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
    .limit(500)

  const listingsPromise = fetchListingBriefsByIds([peerId, ...(t.context_type === 'diensten_listing' ? [t.context_id] : [])])
  const zoekPromise =
    t.context_type === 'zoekertje' ? fetchZoekertjeTitlesByIds([t.context_id]) : Promise.resolve(new Map<string, string>())

  const [messagesResult, listings, zoekTitles] = await Promise.all([messagesPromise, listingsPromise, zoekPromise])

  if (messagesResult.error) {
    return { ok: false, error: friendlyGidsChatDbError(messagesResult.error.message), status: 500 }
  }

  const peer = listings.get(peerId)
  if (!peer) return { ok: false, error: 'Gesprek kon niet geladen worden.', status: 500 }

  const contextTitle =
    t.context_type === 'zoekertje'
      ? (zoekTitles.get(t.context_id) ?? 'Zoekertje')
      : (listings.get(t.context_id)?.name ?? 'Leverancier')

  const mappedMessages: GidsChatMessage[] = (messagesResult.data ?? []).map((m) => {
    const msg = m as MessageRow
    return {
      id: msg.id,
      threadId: msg.thread_id,
      senderListingId: msg.sender_listing_id,
      body: msg.body,
      createdAt: msg.created_at,
      mine: msg.sender_listing_id === myListingId,
    }
  })

  if (opts?.markRead !== false) {
    void markGidsChatThreadReadAdmin(threadId, myListingId)
  }

  return {
    ok: true,
    detail: {
      id: t.id,
      contextType: t.context_type as GidsChatThreadSummary['contextType'],
      contextId: t.context_id,
      sellerListingId: t.seller_listing_id,
      buyerListingId: t.buyer_listing_id,
      status: t.status === 'closed' ? 'closed' : 'open',
      lastMessageAt: t.last_message_at,
      createdAt: t.created_at,
      peerName: peer.name,
      peerCity: peer.city,
      peerSlug: peer.slug,
      contextTitle,
      unread: false,
      lastMessagePreview: mappedMessages.length
        ? mappedMessages[mappedMessages.length - 1]!.body.slice(0, 120)
        : null,
      messages: mappedMessages,
      myListingId,
    },
  }
}

export async function postGidsChatMessageAdmin(opts: {
  threadId: string
  senderListingId: string
  body: string
}): Promise<{ ok: true; message: GidsChatMessage } | { ok: false; error: string; status: number }> {
  const admin = createGidsSupabaseAdmin()
  if (!admin) return { ok: false, error: 'Database niet geconfigureerd.', status: 503 }

  const { data: row } = await admin.from('gids_chat_threads').select('status, seller_listing_id, buyer_listing_id').eq('id', opts.threadId).maybeSingle()
  if (!row) return { ok: false, error: 'Gesprek niet gevonden.', status: 404 }
  if (row.status === 'closed') return { ok: false, error: 'Dit gesprek is gesloten.', status: 403 }
  if (row.seller_listing_id !== opts.senderListingId && row.buyer_listing_id !== opts.senderListingId) {
    return { ok: false, error: 'Geen toegang.', status: 403 }
  }

  const now = new Date().toISOString()
  const { data: inserted, error } = await admin
    .from('gids_chat_messages')
    .insert({
      thread_id: opts.threadId,
      sender_listing_id: opts.senderListingId,
      body: opts.body,
    })
    .select('id, thread_id, sender_listing_id, body, created_at')
    .single()

  if (error) return { ok: false, error: friendlyGidsChatDbError(error.message), status: 500 }

  void admin.from('gids_chat_threads').update({ last_message_at: now }).eq('id', opts.threadId)

  const msg = inserted as MessageRow
  return {
    ok: true,
    message: {
      id: msg.id,
      threadId: msg.thread_id,
      senderListingId: msg.sender_listing_id,
      body: msg.body,
      createdAt: msg.created_at,
      mine: true,
    },
  }
}

export async function markGidsChatThreadReadAdmin(threadId: string, listingId: string): Promise<void> {
  const admin = createGidsSupabaseAdmin()
  if (!admin) return
  const now = new Date().toISOString()
  await admin.from('gids_chat_read_state').upsert(
    { thread_id: threadId, listing_id: listingId, last_read_at: now },
    { onConflict: 'thread_id,listing_id' },
  )
}

export async function countGidsChatUnreadAdmin(listingId: string): Promise<number> {
  const admin = createGidsSupabaseAdmin()
  if (!admin) return 0

  const { data: threads, error } = await admin
    .from('gids_chat_threads')
    .select('id')
    .or(`seller_listing_id.eq.${listingId},buyer_listing_id.eq.${listingId}`)
    .limit(100)

  if (error || !threads?.length) return 0

  const unreadMap = await fetchUnreadFlagsByThreadIds(
    threads.map((t) => t.id as string),
    listingId,
  )
  let count = 0
  for (const v of unreadMap.values()) {
    if (v) count += 1
  }
  return count
}

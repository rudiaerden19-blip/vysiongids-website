import { createGidsSupabaseAdmin } from '@/lib/supabase-gids'
import { fetchListingRowByIdAdmin } from '@/lib/gids-listings-db'
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

function isMissingChatTable(msg: string): boolean {
  return /gids_chat_threads|does not exist|schema cache/i.test(msg)
}

export function friendlyGidsChatDbError(message: string): string {
  if (isMissingChatTable(message)) {
    return 'Chat-tabellen ontbreken. Voer supabase/migrations/020_gids_chat.sql uit in Supabase.'
  }
  return message
}

async function fetchListingBriefAdmin(
  listingId: string,
): Promise<{ name: string; city: string; slug: string } | null> {
  const row = await fetchListingRowByIdAdmin(listingId)
  if (!row) return null
  return { name: row.name, city: row.city, slug: row.slug }
}

async function lastMessageForThread(threadId: string): Promise<{ body: string; created_at: string } | null> {
  const admin = createGidsSupabaseAdmin()
  if (!admin) return null
  const { data } = await admin
    .from('gids_chat_messages')
    .select('body, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!data) return null
  return data as { body: string; created_at: string }
}

async function unreadForThread(threadId: string, myListingId: string): Promise<boolean> {
  const admin = createGidsSupabaseAdmin()
  if (!admin) return false
  const { data: readRow } = await admin
    .from('gids_chat_read_state')
    .select('last_read_at')
    .eq('thread_id', threadId)
    .eq('listing_id', myListingId)
    .maybeSingle()
  const lastRead = (readRow?.last_read_at as string | undefined) ?? '1970-01-01T00:00:00Z'
  const { count } = await admin
    .from('gids_chat_messages')
    .select('id', { count: 'exact', head: true })
    .eq('thread_id', threadId)
    .gt('created_at', lastRead)
    .neq('sender_listing_id', myListingId)
  return (count ?? 0) > 0
}

async function contextTitleForThread(row: ThreadRow): Promise<string> {
  if (row.context_type === 'zoekertje') {
    const admin = createGidsSupabaseAdmin()
    if (!admin) return 'Zoekertje'
    const { data } = await admin.from('gids_zoekertjes').select('title').eq('id', row.context_id).maybeSingle()
    return ((data?.title as string | undefined) ?? 'Zoekertje').trim()
  }
  const brief = await fetchListingBriefAdmin(row.context_id)
  return brief?.name ?? 'Leverancier'
}

async function mapThreadSummary(row: ThreadRow, myListingId: string): Promise<GidsChatThreadSummary | null> {
  const peerId =
    row.seller_listing_id === myListingId ? row.buyer_listing_id : row.seller_listing_id
  const peer = await fetchListingBriefAdmin(peerId)
  if (!peer) return null
  const last = await lastMessageForThread(row.id)
  const unread = await unreadForThread(row.id, myListingId)
  const contextTitle = await contextTitleForThread(row)

  return {
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
    contextTitle,
    unread,
    lastMessagePreview: last ? last.body.slice(0, 120) : null,
  }
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

  const threads: GidsChatThreadSummary[] = []
  for (const row of data ?? []) {
    const mapped = await mapThreadSummary(row as ThreadRow, listingId)
    if (mapped) threads.push(mapped)
  }
  return { ok: true, threads }
}

export async function fetchGidsChatThreadDetailAdmin(
  threadId: string,
  myListingId: string,
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

  const summary = await mapThreadSummary(t, myListingId)
  if (!summary) return { ok: false, error: 'Gesprek kon niet geladen worden.', status: 500 }

  const { data: messages, error: msgErr } = await admin
    .from('gids_chat_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
    .limit(500)

  if (msgErr) return { ok: false, error: friendlyGidsChatDbError(msgErr.message), status: 500 }

  const mappedMessages: GidsChatMessage[] = (messages ?? []).map((m) => {
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

  await markGidsChatThreadReadAdmin(threadId, myListingId)

  return {
    ok: true,
    detail: {
      ...summary,
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

  const { data: row } = await admin.from('gids_chat_threads').select('*').eq('id', opts.threadId).maybeSingle()
  if (!row) return { ok: false, error: 'Gesprek niet gevonden.', status: 404 }
  const t = row as ThreadRow
  if (t.status === 'closed') return { ok: false, error: 'Dit gesprek is gesloten.', status: 403 }
  if (t.seller_listing_id !== opts.senderListingId && t.buyer_listing_id !== opts.senderListingId) {
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
    .select('*')
    .single()

  if (error) return { ok: false, error: friendlyGidsChatDbError(error.message), status: 500 }

  await admin.from('gids_chat_threads').update({ last_message_at: now }).eq('id', opts.threadId)

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
  const listed = await listGidsChatThreadsForListingAdmin(listingId)
  if (!listed.ok) return 0
  return listed.threads.filter((t) => t.unread).length
}

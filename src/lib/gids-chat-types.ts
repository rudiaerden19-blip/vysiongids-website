export type GidsChatContextType = 'zoekertje' | 'diensten_listing'

export type GidsChatThreadSummary = {
  id: string
  contextType: GidsChatContextType
  contextId: string
  sellerListingId: string
  buyerListingId: string
  status: 'open' | 'closed'
  lastMessageAt: string
  createdAt: string
  /** Tegenpartij (naam/stad) voor inbox */
  peerName: string
  peerCity: string
  peerSlug: string
  /** Korte contexttitel (zoekertje-titel of leveranciersnaam) */
  contextTitle: string
  /** Extra regel: categorie/soort/prijs (zoekertje) of null */
  contextMeta: string | null
  unread: boolean
  lastMessagePreview: string | null
}

export type GidsChatMessage = {
  id: string
  threadId: string
  senderListingId: string
  body: string
  createdAt: string
  mine: boolean
}

export type GidsChatThreadDetail = GidsChatThreadSummary & {
  messages: GidsChatMessage[]
  myListingId: string
}

export const GIDS_CHAT_BODY_MAX = 2000

export const GIDS_CHAT_QUICK_MESSAGES = [
  'Is dit nog te koop?',
  'Kunnen we overleggen over de prijs?',
  'Wanneer kan ik langskomen?',
] as const

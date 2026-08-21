'use client'

import GidsChatStartButton from '@/components/GidsChatStartButton'

export default function DienstenProfielChatButton({ slug }: { slug: string }) {
  return (
    <GidsChatStartButton
      contextType="diensten_listing"
      contextSlug={slug}
      className="vysiongids-diensten-action-btn"
      label="Chat"
    />
  )
}

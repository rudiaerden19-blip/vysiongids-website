'use client'

import { useLanguage } from '@/i18n/LanguageProvider'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'

function ChatSectionLoading() {
  const { t } = useLanguage()
  return (
    <section className="vysiongids-surface-card rounded-xl bg-white p-5">
      <p className="text-sm text-gray-500">{t('beheer.chatLoading')}</p>
    </section>
  )
}

const BeheerGidsChatSection = dynamic(() => import('@/components/BeheerGidsChatSection'), {
  ssr: false,
  loading: () => <ChatSectionLoading />,
})

/** Berichten — direct onder weergave-stats op /beheer. */
export default function BeheerChatUnderViews() {
  const searchParams = useSearchParams()
  const chatThreadId = searchParams.get('chat')
  return <BeheerGidsChatSection initialThreadId={chatThreadId} />
}

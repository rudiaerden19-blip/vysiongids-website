'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

type Props = {
  children: React.ReactNode
}

export default function DienstenIntroGate({ children }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(true)

  const continueToForm = useCallback(() => setOpen(false), [])

  const dismiss = useCallback(() => {
    router.push('/diensten')
  }, [router])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, dismiss])

  if (!open) return <>{children}</>

  return (
    <>
      <div className="vysiongids-zaak-intro-backdrop" aria-hidden onClick={dismiss} />
      <div className="vysiongids-zaak-intro-dialog" role="dialog" aria-modal="true" aria-labelledby="diensten-intro-title">
        <div className="vysiongids-zaak-intro-head">
          <h2 id="diensten-intro-title" className="vysiongids-zaak-intro-title">
            Diensten & publiciteit
          </h2>
          <button type="button" className="vysiongids-zaak-intro-close" onClick={dismiss} aria-label="Sluiten">
            ×
          </button>
        </div>
        <div className="vysiongids-zaak-intro-body">
          <p className="vysiongids-zaak-intro-promo">
            Je registreert een <strong>leveranciersprofiel</strong> (geen horecazaak). Lidmaatschap:{' '}
            <strong>€99 per jaar</strong>. Je staat in de gids onder Publiciteit en diensten — niet bij frituren of
            restaurants zoeken.
          </p>
          <p className="vysiongids-zaak-intro-promo">
            Vul je gegevens, categorieën (kassa, meubilair, …) en tot <strong>10 foto&apos;s</strong> in. Na betaling is
            je profiel zichtbaar. Klanten contacteeren je via <strong>Contacteer verkoper</strong> (telefoon/e-mail).
          </p>
          <button type="button" className="vysiongids-zaak-intro-continue" onClick={continueToForm}>
            Doorgaan naar formulier
          </button>
        </div>
      </div>
    </>
  )
}

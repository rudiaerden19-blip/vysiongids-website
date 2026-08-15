'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

type Props = {
  children: React.ReactNode
}

const RULES: { title: string; body: React.ReactNode }[] = [
  {
    title: 'Juiste gegevens',
    body: (
      <>
        Naam, adres, openingsuren, telefoon, e-mail en links moeten kloppen. Geen misleidende teksten of foto&apos;s.
      </>
    ),
  },
  {
    title: 'PIN bewaren',
    body: (
      <>
        Je 6-cijferige PIN is nodig om later in te loggen, je zaak te beheren of te verwijderen. Vysiongids kan je PIN
        niet teruggeven.
      </>
    ),
  },
  {
    title: "Foto's",
    body: (
      <>
        Upload enkel beelden van jouw zaak (max. 3). Geen stockfoto&apos;s van andere zaken.
      </>
    ),
  },
  {
    title: 'Bestellen of reserveren',
    body: (
      <>
        De link gaat rechtstreeks naar jouw site of shop — Vysiongids verwerkt geen bestellingen en rekent{' '}
        <strong>0% commissie</strong>.
      </>
    ),
  },
  {
    title: 'Reviews',
    body: <>Klanten kunnen een review plaatsen op jouw pagina. Reageer niet met valse reviews.</>,
  },
  {
    title: 'Verwijderen',
    body: (
      <>
        Wil je offline? Log in en kies <em>Verwijder je zaak</em> in je account.
      </>
    ),
  },
]

export default function ZaakToevoegenIntroGate({ children }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(true)

  const continueToForm = useCallback(() => setOpen(false), [])

  const dismiss = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    router.push('/')
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

  if (!open) {
    return <>{children}</>
  }

  return (
    <>
      <div className="vysiongids-zaak-intro-backdrop" aria-hidden onClick={dismiss}>
        <span className="vysiongids-zaak-intro-backdrop-media">
          <Image src="/images/hero-header.png" alt="" fill sizes="100vw" priority className="object-cover" />
        </span>
        <span className="vysiongids-zaak-intro-backdrop-dim" aria-hidden />
      </div>
      <div
        className="vysiongids-zaak-intro-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="zaak-intro-title"
      >
        <div className="vysiongids-zaak-intro-head">
          <div className="vysiongids-zaak-intro-head-text">
            <h2 id="zaak-intro-title" className="vysiongids-zaak-intro-title">
              Zaak toevoegen — lees eerst dit
            </h2>
            <p className="vysiongids-zaak-intro-subtitle">
              Voordat je je zaak online zet in Vysiongids, lees onderstaande punten. Zo blijft de gids betrouwbaar voor
              klanten en voor alle horeca-zaken in België.
            </p>
          </div>
          <button type="button" className="vysiongids-zaak-intro-close" onClick={dismiss} aria-label="Sluiten">
            ×
          </button>
        </div>

        <div className="vysiongids-zaak-intro-body">
          <section className="vysiongids-zaak-intro-section" aria-labelledby="zaak-intro-rules-heading">
            <h3 id="zaak-intro-rules-heading" className="vysiongids-zaak-intro-section-title">
              Belangrijke afspraken
            </h3>
            <ul className="vysiongids-zaak-intro-rules">
              {RULES.map((rule) => (
                <li key={rule.title} className="vysiongids-zaak-intro-rule">
                  <p className="vysiongids-zaak-intro-rule-title">{rule.title}</p>
                  <p className="vysiongids-zaak-intro-rule-body">{rule.body}</p>
                </li>
              ))}
            </ul>
          </section>

          <p className="vysiongids-zaak-intro-confirm">
            Door verder te gaan bevestig je dat je deze info gelezen hebt en dat je bevoegd bent om namens deze zaak te
            registreren.
          </p>
        </div>

        <div className="vysiongids-zaak-intro-actions">
          <button type="button" className="vysiongids-zaak-intro-btn-secondary" onClick={dismiss}>
            Sluiten
          </button>
          <button type="button" className="vysiongids-zaak-intro-btn-primary" onClick={continueToForm}>
            Ik heb gelezen — verder met registratie
          </button>
        </div>
      </div>
    </>
  )
}

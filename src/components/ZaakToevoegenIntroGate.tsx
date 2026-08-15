'use client'

import { useCallback, useEffect, useState } from 'react'

type Props = {
  children: React.ReactNode
}

export default function ZaakToevoegenIntroGate({ children }: Props) {
  const [open, setOpen] = useState(true)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  if (!open) {
    return <>{children}</>
  }

  return (
    <>
      <div className="vysiongids-zaak-intro-backdrop" aria-hidden onClick={close} />
      <div
        className="vysiongids-zaak-intro-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="zaak-intro-title"
      >
        <h2 id="zaak-intro-title" className="vysiongids-zaak-intro-title">
          Lees eerst dit
        </h2>
        <div className="vysiongids-zaak-intro-body">
          <p>
            Voordat je je zaak online zet in Vysiongids, lees onderstaande punten. Zo blijft de gids betrouwbaar voor
            klanten en voor alle horeca-zaken in België.
          </p>
          <ul>
            <li>
              <strong>Juiste gegevens:</strong> naam, adres, openingsuren, telefoon, e-mail en links moeten kloppen. Geen
              misleidende teksten of foto&apos;s.
            </li>
            <li>
              <strong>PIN bewaren:</strong> je 6-cijferige PIN is nodig om later in te loggen, je zaak te beheren of te
              verwijderen. Vysiongids kan je PIN niet teruggeven.
            </li>
            <li>
              <strong>Foto&apos;s:</strong> upload enkel beelden van jouw zaak (max. 3). Geen stockfoto&apos;s van andere
              zaken.
            </li>
            <li>
              <strong>Bestellen of reserveren:</strong> de link gaat rechtstreeks naar jouw site of shop — Vysiongids
              verwerkt geen bestellingen en rekent <strong>0% commissie</strong>.
            </li>
            <li>
              <strong>Reviews:</strong> klanten kunnen een review plaatsen op jouw pagina. Reageer niet met valse
              reviews.
            </li>
            <li>
              <strong>Verwijderen:</strong> wil je offline? Log in via <em>Login → Beheer → Verwijder je zaak</em>.
            </li>
          </ul>
          <p className="text-sm text-gray-600">
            Door verder te gaan bevestig je dat je deze info gelezen hebt en dat je bevoegd bent om namens deze zaak te
            registreren.
          </p>
        </div>
        <div className="vysiongids-zaak-intro-actions">
          <button type="button" className="vysiongids-zaak-intro-btn-primary" onClick={close}>
            Ik heb gelezen — verder met registratie
          </button>
        </div>
      </div>
    </>
  )
}

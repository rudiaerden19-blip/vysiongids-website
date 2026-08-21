'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import VysionPlatformPromoModal, { type VysionPlatformPromoKind } from '@/components/VysionPlatformPromoModal'

type Props = {
  children: React.ReactNode
}

export default function ZaakToevoegenIntroGate({ children }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(true)
  const [platformPromo, setPlatformPromo] = useState<VysionPlatformPromoKind | null>(null)

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
      <div className="vysiongids-zaak-intro-backdrop" aria-hidden onClick={dismiss} />
      <div
        className="vysiongids-zaak-intro-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="zaak-intro-title"
      >
        <div className="vysiongids-zaak-intro-head">
          <h2 id="zaak-intro-title" className="vysiongids-zaak-intro-title">
            Lees eerst dit
          </h2>
          <button
            type="button"
            className="vysiongids-zaak-intro-close"
            onClick={dismiss}
            aria-label="Sluiten"
          >
            ×
          </button>
        </div>
        <div className="vysiongids-zaak-intro-body">
          <p className="vysiongids-zaak-intro-promo">
            Wil je lid worden van Vysiongids? Druk dan bovenaan op de knop <strong>Zaak toevoegen</strong> en volg alle
            stappen. Het lidmaatschap kost <strong>€49 per jaar</strong>. Hiervoor ontvang je alle premiumfuncties
            zonder limiet. Je zaak wordt dan direct zichtbaar voor duizenden klanten in de buurt, maar ook in heel
            België.
          </p>
          <p className="vysiongids-zaak-intro-promo">
            Heb je geen reserveringssoftware of online bestelplatform? Indien je lid bent van Vysiongids, kan je je via
            de knoppen hieronder registreren. Deze softwaremodules behoren tot de meest professionele softwareplatformen in
            België. Je kan de software downloaden voor <strong>€49 per jaar</strong>. Dit is tot{' '}
            <strong>20 keer goedkoper</strong> dan andere platformen en alleen toegankelijk voor onze Vysiongids-leden.
          </p>
          <div className="vysiongids-zaak-intro-platform-btns">
            <button
              type="button"
              className="vysiongids-zaak-intro-platform-btn"
              onClick={() => setPlatformPromo('order')}
            >
              Bekijk online bestelplatform
            </button>
            <button
              type="button"
              className="vysiongids-zaak-intro-platform-btn"
              onClick={() => setPlatformPromo('reservations')}
            >
              Bekijk restaurantreserveringen
            </button>
          </div>
          <p className="vysiongids-zaak-intro-promo">
            Heb je wél al een reserverings- en online bestelplatform? Perfect — dit kan je rechtstreeks koppelen aan je
            bestelknop in Vysiongids. Met <strong>één klik</strong> zit de klant op jouw software.
          </p>
          <p className="vysiongids-zaak-intro-lead">
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
              <strong>Foto&apos;s:</strong> upload enkel beelden van jouw zaak (minstens 1, max. 3). Geen stockfoto&apos;s van andere
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
              <strong>Verwijderen:</strong> wil je offline? Log in en kies <em>Verwijder je zaak</em> in je account.
            </li>
            <li>
              <strong>Zoekertjes:</strong> plaats geen zoekertjes die niet stroken met onze regels — deze worden dan
              onmiddellijk verwijderd.
            </li>
            <li>
              <strong>Jobadvertenties:</strong> plaats geen vacatures die niet voldoen aan onze regels — deze worden dan
              onmiddellijk verwijderd.
            </li>
            <li>
              <strong>Veiligheid:</strong> geef nooit bankgegevens of andere gevoelige financiële informatie vrij aan
              derden.
            </li>
          </ul>
          <p className="text-sm text-gray-600">
            Door verder te gaan bevestig je dat je deze info gelezen hebt en dat je bevoegd bent om namens deze zaak te
            registreren.
          </p>
        </div>
        <div className="vysiongids-zaak-intro-actions">
          <button type="button" className="vysiongids-zaak-intro-btn-primary" onClick={continueToForm}>
            Ik heb gelezen — verder met registratie
          </button>
          <button type="button" className="vysiongids-zaak-intro-btn-secondary" onClick={dismiss}>
            Sluiten
          </button>
        </div>
      </div>
      <VysionPlatformPromoModal
        kind={platformPromo}
        open={platformPromo !== null}
        onClose={() => setPlatformPromo(null)}
      />
    </>
  )
}

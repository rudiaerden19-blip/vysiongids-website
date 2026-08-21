import { GIDS_CONTACT } from '@/lib/gids-contact'

export default function GidsPrivacyPolicyContent() {
  return (
    <div className="vysiongids-privacy-policy-content">
      <p className="vysiongids-privacy-policy-lead">
        Vysiongids (horecagids van Vysion) respecteert je privacy. Deze policy geldt voor vysiongids.be en
        gerelateerde diensten.
      </p>

      <section>
        <h3>1. Verantwoordelijke</h3>
        <p>
          Vysion — {GIDS_CONTACT.street}, {GIDS_CONTACT.cityLine}
          <br />
          E-mail:{' '}
          <a href={`mailto:${GIDS_CONTACT.email}`} className="vysiongids-privacy-policy-link">
            {GIDS_CONTACT.email}
          </a>
          <br />
          Telefoon:{' '}
          <a href={`tel:${GIDS_CONTACT.phoneTel}`} className="vysiongids-privacy-policy-link">
            {GIDS_CONTACT.phoneDisplay}
          </a>
        </p>
      </section>

      <section>
        <h3>2. Welke gegevens verzamelen we?</h3>
        <ul>
          <li>Gegevens die horeca en leveranciers zelf publiceren (naam, adres, openingsuren, foto&apos;s, links).</li>
          <li>Reviews en beoordelingen die bezoekers indienen.</li>
          <li>Login voor zaakhouders: zaaknaam en een door jou gekozen PIN (veilig opgeslagen, niet leesbaar).</li>
          <li>Technische gegevens: IP-adres, browsertype, cookies voor taal en sessie.</li>
          <li>Optioneel: locatie als je «dichtbij»-zoeken gebruikt (alleen met jouw toestemming in de browser).</li>
        </ul>
      </section>

      <section>
        <h3>3. Waarvoor gebruiken we gegevens?</h3>
        <ul>
          <li>De gids tonen, zoeken en zaakpagina&apos;s beheren.</li>
          <li>Beheer van je listing, menu, zoekertjes en premium-functies.</li>
          <li>Beveiliging, misbruik voorkomen en support.</li>
          <li>Wettelijke verplichtingen.</li>
        </ul>
      </section>

      <section>
        <h3>4. Delen met derden</h3>
        <p>
          We verkopen geen persoonsgegevens. Hosting, database en e-mail kunnen via betrouwbare verwerkers (o.a. cloud
          hosting). Links naar externe bestelplatformen of websites van zaken vallen onder het privacybeleid van die
          partijen zodra je daar doorklikt.
        </p>
      </section>

      <section>
        <h3>5. Bewaartermijn</h3>
        <p>
          Listing- en reviewgegevens blijven zolang je zaak in de gids staat. Na verwijdering van een zaak wissen we
          listing en bijbehorende data binnen redelijke termijn, behoudens wettelijke bewaarplicht.
        </p>
      </section>

      <section>
        <h3>6. Jouw rechten (AVG/GDPR)</h3>
        <p>Je hebt recht op inzage, rectificatie, verwijdering, beperking, bezwaar en dataportabiliteit waar van toepassing.</p>
        <p>
          Contact:{' '}
          <a href={`mailto:${GIDS_CONTACT.email}`} className="vysiongids-privacy-policy-link">
            {GIDS_CONTACT.email}
          </a>
          . Je kunt ook een klacht indienen bij de Gegevensbeschermingsautoriteit (GBA/AP).
        </p>
      </section>

      <section>
        <h3>7. Cookies</h3>
        <p>
          We gebruiken functionele cookies (o.a. taal, ingelogde beheersessie). Analytische cookies enkel indien
          geactiveerd en conform toestemming waar vereist.
        </p>
      </section>

      <section>
        <h3>8. Wijzigingen</h3>
        <p>We kunnen deze policy bijwerken. De meest recente versie staat steeds in deze popup.</p>
        <p className="vysiongids-privacy-policy-updated">Laatste update: augustus 2026</p>
      </section>
    </div>
  )
}

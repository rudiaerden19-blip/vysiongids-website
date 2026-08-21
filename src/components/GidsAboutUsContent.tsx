import { GIDS_CONTACT } from '@/lib/gids-contact'

export default function GidsAboutUsContent() {
  return (
    <div className="vysiongids-privacy-policy-content">
      <p className="vysiongids-privacy-policy-lead">
        <strong>Vysiongids</strong> is de horecagids van Vysion: vind zaken in heel België, bekijk info en bestel rechtstreeks
        bij de zaak — zonder commissie via de gids.
      </p>

      <section>
        <h3>Wat doen we?</h3>
        <p>
          We brengen horeca en hun diensten online in kaart: frituren, restaurants, cafés en meer. Zaakhouders kunnen hun
          listing beheren, foto&apos;s tonen, reviews ontvangen en — indien gewenst — premium functies gebruiken zoals
          zoekertjes of een digitaal menu.
        </p>
      </section>

      <section>
        <h3>Voor bezoekers</h3>
        <p>
          Zoek op plaats, keuken of voorzieningen. Open zaakpagina&apos;s met adres, openingsuren en route. Bestellen doe je
          via de link van de zaak zelf; Vysiongids zit niet tussen jou en de horecazaak.
        </p>
      </section>

      <section>
        <h3>Voor horeca</h3>
        <p>
          Voeg je zaak toe of log in om gegevens bij te werken. Leden kunnen ook kennismaken met het online bestel- en
          reserveringsplatform van Vysion tegen voordelige tarieven voor gidsleden.
        </p>
      </section>

      <section>
        <h3>Vysion</h3>
        <p>
          Vysiongids wordt aangeboden door Vysion, gevestigd te {GIDS_CONTACT.street}, {GIDS_CONTACT.cityLine}. Voor vragen:
          {' '}
          <a href={`mailto:${GIDS_CONTACT.email}`} className="vysiongids-privacy-policy-link">
            {GIDS_CONTACT.email}
          </a>
          .
        </p>
      </section>
    </div>
  )
}

# Vysiongids — wat klanten kunnen zoeken (tekst & inspreken)

Alles in **één zoekveld** (`q` op home en `/zoeken`). Optioneel: dropdown **type zaak** en **regio/provincie** in de header.

## Alles tonen

- `alles`, `alle`, leeg veld (+ type «Alles»)

## Zaaktype (herkend in de zin)

| Type | Voorbeelden |
|------|-------------|
| Frituur | frituur, friet, friture, frieten |
| Kebab | kebab, kebap, doner, döner, durum |
| Pizza | pizza, pizzas |
| Snack | snack, snackbar |
| Restaurant | restaurant, resto |
| Chinees | chinees, chinees restaurant |
| Sushi | sushi restaurant |
| Café / bistro | café, cafe, bistro |
| Broodjeszaak | broodjes, broodjeszaak |
| Traiteur | traiteur, catering |
| Sterrenzaak | sterrenzaak, michelin |
| Bakkerij / slagerij | bakker, bakkerij, slager, beenhouwer, … |

**Diensten / leveranciers** (zelfde zoekveld, o.a. kassa, POS, meubilair, diensten, zaaknaam zoals Vysion): resultaten onder **Leveranciers & diensten**, daarna horeca.

**Combinaties:** «frituur nu open», «pizza met levering in hasselt», «kebab halal genk», «kassa», «vysion».

## Nu open

- nu open, nu geopend, open nu, momenteel open, vandaag open, nog open

Filtert op **openingstijden (Europe/Brussels)** — zelfde logica als badge «Nu open» op de kaart.

## Levering & afhalen

- **Levering:** levering, bezorging, met levering, met bezorging, thuisbezorgd, …
- **Gratis levering:** gratis levering, gratis bezorging (alleen zaken met leveringskosten **€0** ingevuld)
- **Afhalen:** afhalen, takeaway, take-away, om mee te nemen

Alleen zaken die het **in beheer aangevinkt** hebben (of legacy fallback) komen in de resultaten.

## Keuken / stijl

Franse, Italiaanse, Belgische, Turkse, Griekse, Japanse, Chinese, Indische, Mexicaanse, Amerikaanse keuken; grill, sushi, pizzeria, vegetarisch — plus synoniemen (bv. pasta, burger, wok, curry).

## Voorzieningen (profielopties)

Vegetarisch, vegan, halal, glutenvrij, terras, parking, Wi‑Fi, Bancontact, honden welkom, kindvriendelijk, toegankelijk, groepen, cadeaubonnen — met veel **synoniemen en spraakvarianten**.

## Plaats & naam

Wat overblijft in de zin matcht op **naam, straat, postcode, stad, provincie**, bv.:

- `Pelt`, `Hasselt`, `3910`, `Fabrieksstraat`
- zaaknaam of deel ervan (spraak: hints via `/api/gids/voice-names`)

## Dichtbij (locatie)

- **dichtbij**, **in de buurt**, **nabij**, **bij mij in de buurt**, …
- Browser vraagt **locatie** (GPS); resultaten binnen **40 km**, gesorteerd op afstand
- Ook bij **«nu open»** (zonder «dichtbij») wordt locatie gevraagd om open zaken **in de buurt** te sorteren
- Op de kaart zie je **afstand en rijtijd** (bv. `2,3 km · ca. 6 min`) — schatting op basis van je locatie, geen live Waze-API
- Knop **Waze** op elke kaart zodra locatie actief is
- Weiger je locatie: wel zoeken op type/naam, maar **niet** op afstand gesorteerd — knop «Sta locatie toe» op `/zoeken`

Voorbeelden: `frituur dichtbij`, `pizza in de buurt`, `kebab nabij`.

## Acties (review & bestellen)

Herkenning op **naam** (spraakhints + fuzzy, bv. «nolim» → Nolim):

| Intent | Voorbeelden | Actie |
|--------|-------------|--------|
| Review | geef review voor frituur nolim, review nolim, beoordeling voor … | `/zaak/{slug}/reviews#schrijven` |
| Bestellen | nolim bestellen, bestel bij blonkys, order … | **Bestel-URL** van de zaak (nieuw tabblad) |

Geen match op zaaknaam → valt terug op normale zoekresultaten.

## Waze & rijden (spraak)

| Intent | Voorbeelden | Actie |
|--------|-------------|--------|
| Zoeken + onthouden | frituur dichtbij nu open | Resultaten + TTS; **bovenste zaak** wordt onthouden (~30 min) |
| Waze (vervolg) | waze er naartoe, navigeer er naartoe | **Waze-app** naar laatst gevonden / bovenste zaak |
| Waze (één zin) | waze naar dichtstbijzijnde open frituur | Zoeken op locatie + meteen Waze naar #1 |

Locatie is nodig voor dichtbij, nu open in de buurt, en Waze-zoeken. Rijtijd op kaarten is een **schatting**; Waze berekent de echte route.

## Regio

- Provincie via site-header / cookie → filter `prov` (los van `q`)
- Type-dropdown filtert naast `q` (bv. type «Frituur» + q «nu open»)

## Techniek

- Parser: `src/lib/gids-listing-search.ts` → `parseListingSearchQuery`
- Filter: `searchListings` in `src/lib/listings.ts`

Nieuwe synoniemen: uitbreiden `AMENITY_EXTRA_TERMS`, `LISTING_TYPE_SEARCH`, `OPEN_NOW_PHRASES` in die file.

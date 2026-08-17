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

**Combinaties:** «frituur nu open», «pizza met levering in hasselt», «kebab halal genk».

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

## Regio

- Provincie via site-header / cookie → filter `prov` (los van `q`)
- Type-dropdown filtert naast `q` (bv. type «Frituur» + q «nu open»)

## Techniek

- Parser: `src/lib/gids-listing-search.ts` → `parseListingSearchQuery`
- Filter: `searchListings` in `src/lib/listings.ts`

Nieuwe synoniemen: uitbreiden `AMENITY_EXTRA_TERMS`, `LISTING_TYPE_SEARCH`, `OPEN_NOW_PHRASES` in die file.

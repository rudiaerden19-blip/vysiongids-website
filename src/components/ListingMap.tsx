'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Listing } from '@/lib/listing-types'
import { formatListingAddressLines, getListingCoordinates } from '@/lib/listings'
import ListingNavigationButtons from '@/components/ListingNavigationButtons'

/** Rode pin (Google-achtig) + satelliettegels via Esri. */
const pinIcon = L.icon({
  iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-red.png',
  iconRetinaUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const ESRI_SATELLITE =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const ESRI_LABELS =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'

function OpenPopupOnLoad({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], 18)
  }, [map, lat, lng])
  return null
}

function LockMapView() {
  const map = useMap()
  useEffect(() => {
    map.dragging.disable()
    map.touchZoom.disable()
    map.doubleClickZoom.disable()
    map.boxZoom.disable()
    map.keyboard.disable()
    map.scrollWheelZoom.disable()
    if (map.zoomControl) map.zoomControl.remove()
  }, [map])
  return null
}

function MarkerWithPopup({
  lat,
  lng,
  popup,
}: {
  lat: number
  lng: number
  popup: ReactNode
}) {
  const markerRef = useRef<L.Marker>(null)
  useEffect(() => {
    markerRef.current?.openPopup()
  }, [lat, lng])
  return (
    <Marker ref={markerRef} position={[lat, lng]} icon={pinIcon}>
      <Popup closeButton autoPan={false}>
        {popup}
      </Popup>
    </Marker>
  )
}

export type ListingMapProps = {
  listing: Listing
}

export default function ListingMap({ listing }: ListingMapProps) {
  const { lat, lng } = getListingCoordinates(listing)
  const { street, cityLine } = formatListingAddressLines(listing)

  return (
    <section className="mt-8" aria-label="Locatie op de kaart">
      <h2 className="text-lg font-bold text-gray-900">Adres</h2>
      <div className="vysiongids-listing-map relative mt-3 overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
        <MapContainer
          center={[lat, lng]}
          zoom={18}
          zoomControl={false}
          dragging={false}
          touchZoom={false}
          doubleClickZoom={false}
          boxZoom={false}
          keyboard={false}
          scrollWheelZoom={false}
          className="z-0 h-[min(420px,55vh)] w-full"
          style={{ height: 'min(420px, 55vh)', width: '100%' }}
        >
          <TileLayer
            attribution='Tiles &copy; <a href="https://www.esri.com/">Esri</a>'
            url={ESRI_SATELLITE}
            maxZoom={19}
          />
          <TileLayer url={ESRI_LABELS} maxZoom={19} opacity={0.85} />
          <LockMapView />
          <OpenPopupOnLoad lat={lat} lng={lng} />
          <MarkerWithPopup
            lat={lat}
            lng={lng}
            popup={
              <div className="min-w-[11rem] pr-1 text-sm leading-snug">
                <p className="font-bold text-gray-900">{listing.name}</p>
                <p className="mt-1 text-gray-600">
                  {street}
                  <br />
                  {cityLine}
                </p>
                <div className="mt-3">
                  <ListingNavigationButtons listing={listing} compact />
                </div>
              </div>
            }
          />
        </MapContainer>
      </div>
      <p className="mt-2 text-sm text-gray-600">
        {street}, {cityLine}
      </p>
      <div className="mt-3">
        <ListingNavigationButtons listing={listing} />
      </div>
    </section>
  )
}

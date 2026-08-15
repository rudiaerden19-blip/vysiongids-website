import { DELIVERY_RADIUS_KM_OPTIONS } from '@/lib/listing-delivery-radius'

type Props = {
  idPrefix?: string
  defaultValueKm?: number | null
}

function radiusOptions(defaultValueKm?: number | null): number[] {
  const opts: number[] = [...DELIVERY_RADIUS_KM_OPTIONS]
  if (defaultValueKm != null && defaultValueKm > 0 && !opts.some((o) => o === defaultValueKm)) {
    opts.push(defaultValueKm)
    opts.sort((a, b) => a - b)
  }
  return opts
}

export default function DeliveryRadiusKmField({ idPrefix = '', defaultValueKm }: Props) {
  const id = `${idPrefix}deliveryRadiusKm`
  const defaultStr =
    defaultValueKm != null && defaultValueKm > 0 ? String(defaultValueKm) : ''
  const options = radiusOptions(defaultValueKm)

  return (
    <div>
      <label className="vysiongids-form-label" htmlFor={id}>
        Leveringsstraal (km)
      </label>
      <select id={id} name="deliveryRadiusKm" defaultValue={defaultStr} className="vysiongids-form-input mt-1">
        <option value="">Niet van toepassing / onbekend</option>
        {options.map((km) => (
          <option key={km} value={km}>
            {km} km
          </option>
        ))}
      </select>
      <p className="mt-1 text-xs text-gray-500">Maximale afstand waarin de zaak levert (optioneel).</p>
    </div>
  )
}

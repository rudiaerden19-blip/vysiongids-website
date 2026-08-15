import { LISTING_CUISINE_TYPES } from '@/lib/listing-cuisine-types'

type Props = {
  id?: string
  defaultValue?: string
}

export default function KitchenTypeSelect({ id = 'cuisineType', defaultValue }: Props) {
  return (
    <div>
      <label className="vysiongids-form-label" htmlFor={id}>
        Type keuken
      </label>
      <select id={id} name="cuisineType" className="vysiongids-form-input mt-1" defaultValue={defaultValue ?? ''}>
        <option value="">— Kies type keuken (optioneel) —</option>
        {LISTING_CUISINE_TYPES.map((c) => (
          <option key={c.id} value={c.id}>
            {c.emoji} {c.label}
          </option>
        ))}
      </select>
    </div>
  )
}

import type { ListingAmenityId } from '@/lib/listing-types'

export default function ListingAmenityIcon({ id }: { id: ListingAmenityId }) {
  const stroke = 'var(--accent)'
  const props = { width: 18, height: 18, fill: 'none', stroke, strokeWidth: 1.8 }
  switch (id) {
    case 'bancontact':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...props}>
          <rect x="4" y="7" width="16" height="10" rx="2" />
          <path d="M4 11h16" />
        </svg>
      )
    case 'wifi':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...props}>
          <path d="M5 12.5a11 11 0 0114 0M8.5 16a6.5 6.5 0 017 0M12 20h.01" />
        </svg>
      )
    case 'chef':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...props}>
          <path d="M6 11h12v2a6 6 0 01-12 0v-2zM8 11V9a4 4 0 018 0v2" />
        </svg>
      )
    case 'wheelchair':
    case 'accessible':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...props}>
          <circle cx="9" cy="6" r="2" />
          <path d="M9 8v5h4l2 4H9v-5" />
          <circle cx="16" cy="18" r="3" />
        </svg>
      )
    case 'terrace':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...props}>
          <path d="M5 18h14M7 18V10h10v8M12 10V6" />
          <path d="M9 6h6" />
        </svg>
      )
    case 'halal':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...props}>
          <path d="M8 12c0-2.5 1.8-4.5 4-4.5s4 2 4 4.5v6H8v-6z" />
          <path d="M12 7.5V4M10 5l2-2 2 2" />
        </svg>
      )
    case 'gluten_free':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...props}>
          <path d="M12 3c-2 3-4 6-4 9a4 4 0 008 0c0-3-2-6-4-9z" />
          <path d="M9 15h6" />
        </svg>
      )
    case 'vegetarian':
    case 'vegan':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...props}>
          <path d="M12 21c-4-4-6-8-6-12a6 6 0 1112 0c0 4-2 8-6 12z" />
        </svg>
      )
    case 'takeaway':
    case 'delivery':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...props}>
          <path d="M4 7h11v10H4zM15 10h3l2 3v4h-5V10z" />
          <circle cx="7" cy="18" r="2" />
          <circle cx="17" cy="18" r="2" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...props}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      )
  }
}

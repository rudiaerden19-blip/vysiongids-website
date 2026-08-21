type Props = {
  size?: number
  /** Wit op accent-knoppen; anders accent-kleur op lichte achtergrond */
  variant?: 'onDark' | 'onLight'
  className?: string
}

export default function GidsLoadingSpinner({ size = 20, variant = 'onDark', className = '' }: Props) {
  return (
    <span
      className={`gids-loading-spinner gids-loading-spinner--${variant} ${className}`.trim()}
      role="status"
      aria-hidden
      style={{ width: size, height: size }}
    />
  )
}

export function GidsButtonLoadingContent({ label = 'Bezig…' }: { label?: string }) {
  return (
    <span className="gids-btn-loading">
      <GidsLoadingSpinner size={18} variant="onDark" />
      <span>{label}</span>
    </span>
  )
}

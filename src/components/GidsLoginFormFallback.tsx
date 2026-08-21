import GidsLoadingSpinner from '@/components/GidsLoadingSpinner'

export default function GidsLoginFormFallback() {
  return (
    <div className="mt-8 flex items-center gap-3 text-gray-600" aria-live="polite">
      <GidsLoadingSpinner size={28} variant="onLight" />
      <span>Formulier laden…</span>
    </div>
  )
}

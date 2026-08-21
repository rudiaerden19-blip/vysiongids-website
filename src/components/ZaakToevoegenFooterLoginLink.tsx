'use client'

import GidsInternalNavLink from '@/components/GidsInternalNavLink'

export default function ZaakToevoegenFooterLoginLink() {
  return (
    <p className="mt-10 border-t border-gray-200 pt-6 text-sm text-gray-600">
      Zaak al online en wil je alles verwijderen?{' '}
      <GidsInternalNavLink href="/login" className="font-semibold text-accent hover:underline" loadingMessage="Login openen…">
        Log in
      </GidsInternalNavLink>{' '}
      → beheer → <strong>Verwijder je zaak</strong>.
    </p>
  )
}

import { tServer } from '@/i18n/server-translate'

export async function BeheerFormSkeleton() {
  const [title, loading] = await Promise.all([tServer('beheer.editFormTitle'), tServer('beheer.formLoading')])
  return (
    <section className="vysiongids-surface-card rounded-xl bg-white p-5" aria-busy="true">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <p className="mt-2 text-sm text-gray-500">{loading}</p>
    </section>
  )
}

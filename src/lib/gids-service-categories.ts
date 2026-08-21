export const GIDS_SERVICE_CATEGORIES = [
  { id: 'kassa', label: 'Kassasystemen & POS' },
  { id: 'meubilair', label: 'Stoelen & tafels / meubilair' },
  { id: 'inrichting', label: 'Inrichting horeca' },
  { id: 'keukenapparatuur', label: 'Keukenapparatuur' },
  { id: 'groothandel', label: 'Groothandel & leverancier' },
  { id: 'schoonmaak', label: 'Schoonmaak & onderhoud' },
  { id: 'it', label: 'IT & netwerk' },
  { id: 'marketing', label: 'Marketing & reclame' },
  { id: 'verlichting', label: 'Verlichting' },
  { id: 'textiel', label: 'Textiel & uniformen' },
  { id: 'verpakking', label: 'Verpakking & disposables' },
  { id: 'overig', label: 'Overige diensten' },
] as const

export type GidsServiceCategoryId = (typeof GIDS_SERVICE_CATEGORIES)[number]['id']

const VALID_IDS = new Set<string>(GIDS_SERVICE_CATEGORIES.map((c) => c.id))

export function isValidServiceCategoryId(id: string): id is GidsServiceCategoryId {
  return VALID_IDS.has(id)
}

export function serviceCategoryLabel(id: string): string {
  return GIDS_SERVICE_CATEGORIES.find((c) => c.id === id)?.label ?? id
}

export function parseServiceCategoriesFromForm(form: FormData): GidsServiceCategoryId[] {
  const raw = form.getAll('serviceCategories')
  const out: GidsServiceCategoryId[] = []
  for (const item of raw) {
    const id = String(item).trim()
    if (!id || !isValidServiceCategoryId(id) || out.includes(id)) continue
    out.push(id)
  }
  return out
}

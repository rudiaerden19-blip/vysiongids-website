export type GidsMenuProduct = {
  id: string
  categoryId: string
  name: string
  description: string | null
  priceEur: number | null
  imageUrl: string | null
  sortOrder: number
  isActive: boolean
}

export type GidsMenuCategory = {
  id: string
  name: string
  sortOrder: number
  isActive: boolean
  products: GidsMenuProduct[]
}

export type GidsMenuCatalog = {
  categories: GidsMenuCategory[]
}

export type GidsMenuSavePayload = {
  categories: {
    id: string
    name: string
    sortOrder: number
    isActive: boolean
    products: {
      id: string
      name: string
      description?: string | null
      priceEur?: number | null
      imageUrl?: string | null
      sortOrder: number
      isActive: boolean
    }[]
  }[]
}

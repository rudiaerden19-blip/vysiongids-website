import { NextResponse } from 'next/server'
import { fetchGidsMenuCatalogBySlugPublic } from '@/lib/gids-menu-db'

type Props = { params: Promise<{ slug: string }> }

export async function GET(_req: Request, { params }: Props) {
  const { slug } = await params
  const catalog = await fetchGidsMenuCatalogBySlugPublic(slug)
  if (!catalog) {
    return NextResponse.json({ catalog: null }, { status: 404 })
  }
  return NextResponse.json({ catalog })
}

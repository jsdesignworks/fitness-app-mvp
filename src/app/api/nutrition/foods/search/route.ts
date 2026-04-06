import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { FoodRepository } from '@/lib/repositories/nutrition/food.repository'

/**
 * GET /api/nutrition/foods/search?q= — search foods; returns list of foods (with nutrients for display).
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return NextResponse.json(
      { error: 'Unauthorized', message: authResult.error },
      { status: 401 }
    )
  }
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''
  const query = (typeof q === 'string' ? q : '').trim()
  if (!query) {
    return NextResponse.json({ foods: [] })
  }
  try {
    const foods = await FoodRepository.search(query)
    const withNutrients = await Promise.all(
      foods.map(async (f) => {
        const nutrients = await FoodRepository.getNutrients(f.id)
        return { ...f, nutrients: nutrients ?? undefined }
      })
    )
    return NextResponse.json({ foods: withNutrients })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Search failed'
    return NextResponse.json({ error: 'Server error', message }, { status: 500 })
  }
}

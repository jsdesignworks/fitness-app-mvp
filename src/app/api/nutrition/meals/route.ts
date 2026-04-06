import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import { NutritionLoggingService } from '@/lib/services/nutrition/logging.service'
import type { MealType } from '@/lib/domain/nutrition.types'

/**
 * POST /api/nutrition/meals — body { nutritionDayId, mealType }; add meal; return 201 + meal.
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return NextResponse.json(
      { error: 'Unauthorized', message: authResult.error },
      { status: 401 }
    )
  }
  const body = await request.json().catch(() => ({}))
  const { nutritionDayId, mealType } = body
  if (!nutritionDayId || typeof nutritionDayId !== 'string') {
    return NextResponse.json(
      { error: 'Bad request', message: 'nutritionDayId is required' },
      { status: 400 }
    )
  }
  const validMealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout', 'custom']
  if (!mealType || !validMealTypes.includes(mealType)) {
    return NextResponse.json(
      { error: 'Bad request', message: 'mealType must be one of: ' + validMealTypes.join(', ') },
      { status: 400 }
    )
  }
  try {
    const meal = await NutritionLoggingService.addMeal(authResult.userId, nutritionDayId, mealType)
    return NextResponse.json(meal, { status: 201 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to add meal'
    const status = message.includes('not found') || message.includes('denied') ? 404 : 500
    return NextResponse.json({ error: 'Server error', message }, { status })
  }
}

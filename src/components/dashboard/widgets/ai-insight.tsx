'use client'

import { useRouter } from 'next/navigation'
import { DashboardWidget } from '../dashboard-widget'
import { DpsAiInsightCard } from '@/components/dps'

type AiInsightProps = {
  hasWorkoutData?: boolean
  hasNutritionData?: boolean
  isLoading: boolean
  error: string | null
  onRetry?: () => void
}

/**
 * Placeholder widget: no fake recommendations. Shows honest copy and link to chat.
 */
export function AiInsightWidget({
  hasWorkoutData,
  hasNutritionData,
  isLoading,
  error,
  onRetry,
}: AiInsightProps) {
  const router = useRouter()
  const hasAnyData = hasWorkoutData || hasNutritionData
  const message = hasAnyData
    ? 'Log more workouts and food to get personalized macro and training insights in chat.'
    : 'Complete a workout or log food to unlock AI tips and insights.'

  return (
    <DashboardWidget
      id="ai_insight"
      title="AI insight (preview)"
      isLoading={isLoading}
      error={error}
      isEmpty={false}
      onRetry={onRetry}
    >
      <DpsAiInsightCard
        insightText={
          <>
            <p className="text-k-xs text-muted-foreground mb-2">
              Personalized coaching is not enabled yet. No automated recommendations are shown here.
            </p>
            <p className="text-sm text-muted-foreground">{message}</p>
          </>
        }
        ctaLabel="Open chat"
        onCta={() => router.push('/chat')}
        className="shadow-none"
      />
    </DashboardWidget>
  )
}

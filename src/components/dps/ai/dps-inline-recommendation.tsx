'use client'

import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type DpsInlineRecommendationProps = {
  text: ReactNode
  actionLabel?: string
  onAction?: () => void
  className?: string
}

/**
 * Small embedded recommendation block.
 * UI-only: parents supply the recommendation copy and optional action.
 */
export function DpsInlineRecommendation({
  text,
  actionLabel,
  onAction,
  className,
}: DpsInlineRecommendationProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border/60 bg-muted/15 px-4 py-3',
        'dps-stack-y',
        className
      )}
    >
      <div className="text-k-sm leading-relaxed text-muted-foreground break-words [&_a]:text-accent [&_a]:underline">
        {text}
      </div>
      {actionLabel && onAction ? (
        <div>
          <Button type="button" size="sm" variant="secondary" onClick={onAction} className="dps-focus-ring">
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  )
}


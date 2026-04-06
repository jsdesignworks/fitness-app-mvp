'use client'

import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type DpsAiInsightCardProps = {
  title?: ReactNode
  insightText: ReactNode
  label?: ReactNode
  confidence?: ReactNode
  ctaLabel?: string
  onCta?: () => void
  className?: string
}

/**
 * Presentation-only card for "AI insight" style content.
 * Parents provide copy/labels; no AI generation occurs here.
 */
export function DpsAiInsightCard({
  title,
  insightText,
  label,
  confidence,
  ctaLabel,
  onCta,
  className,
}: DpsAiInsightCardProps) {
  return (
    <Card className={cn('bg-card', className)} variant="default">
      {title || label || confidence ? (
        <CardHeader className="pb-3">
          {title ? <CardTitle className="text-k-base">{title}</CardTitle> : null}
          {label ? <CardDescription className="text-k-sm">{label}</CardDescription> : null}
          {confidence ? (
            <CardDescription className="text-k-xs">
              Confidence: <span className="font-medium">{confidence}</span>
            </CardDescription>
          ) : null}
        </CardHeader>
      ) : null}
      <CardContent className="space-y-3">
        <div className="text-k-sm leading-relaxed text-muted-foreground break-words [&_a]:text-accent [&_a]:underline">
          {insightText}
        </div>
        {ctaLabel && onCta ? (
          <div className="pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onCta} className="dps-focus-ring">
              {ctaLabel}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}


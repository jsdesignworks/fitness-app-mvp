'use client'

import type { ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Info, Settings2, X } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { DpsMessageCardBaseProps, DpsMessageReadState, DpsMessageTone } from './dps-message-types'

const cardShellVariants = cva('min-w-0 transition-colors', {
  variants: {
    tone: {
      info: 'border-l-4 border-l-accent bg-card',
      success: 'border-l-4 border-l-emerald-500/80 bg-card',
      warning: 'border-l-4 border-l-amber-500/80 bg-card',
      error: 'border-l-4 border-l-destructive bg-card',
      system: 'border-l-4 border-l-muted-foreground/50 bg-muted/30',
    },
    readState: {
      unread: 'border-border shadow-sm ring-1 ring-accent/20',
      read: 'border-border opacity-95',
      highlighted: 'border-border shadow-glow-cyan-strong ring-1 ring-accent/40',
    },
  },
  defaultVariants: {
    tone: 'info',
    readState: 'read',
  },
})

const defaultIconForTone = (tone: DpsMessageTone): ReactNode => {
  const className = 'h-4 w-4 shrink-0'
  switch (tone) {
    case 'success':
      return <CheckCircle2 className={cn(className, 'text-emerald-500')} aria-hidden />
    case 'warning':
      return <AlertCircle className={cn(className, 'text-amber-500')} aria-hidden />
    case 'error':
      return <AlertCircle className={cn(className, 'text-destructive')} aria-hidden />
    case 'system':
      return <Settings2 className={cn(className, 'text-muted-foreground')} aria-hidden />
    default:
      return <Info className={cn(className, 'text-accent')} aria-hidden />
  }
}

export type DpsMessageCardProps = DpsMessageCardBaseProps

export function DpsMessageCard({
  body,
  title,
  timestamp,
  tone = 'info',
  readState = 'read',
  icon,
  onDismiss,
  dismissLabel = 'Dismiss',
  primaryAction,
  secondaryAction,
  asListItem = false,
  className,
}: DpsMessageCardProps) {
  const showIcon = icon ?? defaultIconForTone(tone)
  const dataState: DpsMessageReadState = readState

  return (
    <Card
      variant="default"
      className={cn(cardShellVariants({ tone, readState }), className)}
      data-state={dataState}
      data-tone={tone}
      role={asListItem ? 'listitem' : undefined}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex gap-3">
          {showIcon ? (
            <div className="pt-0.5 text-muted-foreground" aria-hidden>
              {showIcon}
            </div>
          ) : null}
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              {title ? (
                <p className="text-k-sm font-semibold leading-snug text-foreground">{title}</p>
              ) : null}
              <div className="flex shrink-0 items-center gap-1">
                {timestamp ? (
                  <time className="text-k-xs text-muted-foreground tabular-nums">{timestamp}</time>
                ) : null}
                {onDismiss ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground dps-focus-ring"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDismiss()
                    }}
                    aria-label={dismissLabel}
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="text-k-sm leading-relaxed text-muted-foreground break-words [&_a]:text-accent [&_a]:underline">
              {body}
            </div>
            {primaryAction || secondaryAction ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {primaryAction ? (
                  <Button
                    type="button"
                    size="sm"
                    className="dps-focus-ring"
                    onClick={(e) => {
                      e.stopPropagation()
                      primaryAction.onClick()
                    }}
                  >
                    {primaryAction.label}
                  </Button>
                ) : null}
                {secondaryAction ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="dps-focus-ring"
                    onClick={(e) => {
                      e.stopPropagation()
                      secondaryAction.onClick()
                    }}
                  >
                    {secondaryAction.label}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export type DpsMessageCardVariantProps = VariantProps<typeof cardShellVariants>

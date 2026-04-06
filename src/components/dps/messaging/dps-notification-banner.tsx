'use client'

import type { ReactNode } from 'react'
import { cva } from 'class-variance-authority'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DpsMessageTone } from './dps-message-types'

const bannerVariants = cva(
  'flex w-full flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4',
  {
    variants: {
      tone: {
        info: 'border-accent/40 bg-accent/5 text-foreground',
        success: 'border-emerald-500/40 bg-emerald-500/5 text-foreground',
        warning: 'border-amber-500/40 bg-amber-500/5 text-foreground',
        error: 'border-destructive/40 bg-destructive/5 text-foreground',
        system: 'border-border bg-muted/40 text-foreground',
      } satisfies Record<DpsMessageTone, string>,
    },
    defaultVariants: {
      tone: 'info',
    },
  }
)

export type DpsNotificationBannerProps = {
  /** Main content; keep concise for inline layout. */
  children: ReactNode
  tone?: DpsMessageTone
  /** Optional heading (not required for short notices). */
  title?: ReactNode
  className?: string
  onDismiss?: () => void
  dismissLabel?: string
}

/**
 * Inline full-width banner (not fixed). Use for page/section notices.
 * - `error` tone: `role="alert"` (assertive).
 * - Other tones: `role="status"` + `aria-live="polite"`.
 */
export function DpsNotificationBanner({
  children,
  tone = 'info',
  title,
  className,
  onDismiss,
  dismissLabel = 'Dismiss notice',
}: DpsNotificationBannerProps) {
  const isError = tone === 'error'
  const role = isError ? 'alert' : 'status'
  const ariaLive = isError ? ('assertive' as const) : ('polite' as const)

  return (
    <div
      className={cn(bannerVariants({ tone }), className)}
      role={role}
      aria-live={ariaLive}
    >
      <div className="min-w-0 flex-1 space-y-1">
        {title ? (
          <p className="text-k-sm font-semibold leading-snug text-foreground">{title}</p>
        ) : null}
        <div className="text-k-sm leading-relaxed text-muted-foreground break-words [&_a]:text-accent [&_a]:underline">
          {children}
        </div>
      </div>
      {onDismiss ? (
        <div className="flex shrink-0 justify-end sm:justify-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground dps-focus-ring"
            onClick={onDismiss}
            aria-label={dismissLabel}
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      ) : null}
    </div>
  )
}

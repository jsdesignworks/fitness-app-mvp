'use client'

import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export type DpsThinkingIndicatorProps = {
  /** Screen-reader label. */
  label?: string
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>

/**
 * Animated dots used for AI "thinking"/typing states.
 * UI-only: no timers or async behavior.
 */
export function DpsThinkingIndicator({
  label = 'Assistant is typing',
  className,
  ...rest
}: DpsThinkingIndicatorProps) {
  return (
    <div
      className={cn('flex items-center gap-1', className)}
      role="status"
      aria-live="polite"
      aria-label={label}
      {...rest}
    >
      <span className="inline-block h-2 w-2 rounded-full bg-current/70 animate-bounce [animation-delay:0ms]" />
      <span className="inline-block h-2 w-2 rounded-full bg-current/70 animate-bounce [animation-delay:150ms]" />
      <span className="inline-block h-2 w-2 rounded-full bg-current/70 animate-bounce [animation-delay:300ms]" />
    </div>
  )
}


'use client'

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type DpsFilterChipProps = {
  children: ReactNode
  selected?: boolean
  onClick: () => void
  disabled?: boolean
  className?: string
}

/**
 * Toggle / single-choice filter control (toolbar chips).
 */
export function DpsFilterChip({
  children,
  selected,
  onClick,
  disabled,
  className,
}: DpsFilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'dps-focus-ring inline-flex min-h-touch shrink-0 items-center justify-center rounded-full border px-3 py-1.5 text-k-sm font-medium transition-colors duration-kinetic sm:min-h-0',
        selected
          ? 'border-accent bg-accent/15 text-accent'
          : 'border-border/80 bg-muted/30 text-muted-foreground hover:border-accent/40 hover:bg-muted/50 hover:text-foreground',
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
    >
      {children}
    </button>
  )
}

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type DpsFormActionsProps = {
  children: ReactNode
  className?: string
}

/** Primary / secondary actions row — wraps on narrow viewports. */
export function DpsFormActions({ children, className }: DpsFormActionsProps) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse gap-3 xs:flex-row xs:flex-wrap xs:items-center',
        className
      )}
    >
      {children}
    </div>
  )
}

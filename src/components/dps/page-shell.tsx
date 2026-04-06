import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type DpsPageShellVariant = 'default' | 'wide' | 'full'

const maxWidthClass: Record<DpsPageShellVariant, string> = {
  default: 'max-w-content',
  wide: 'max-w-content-wide 3xl:max-w-[90rem]',
  full: 'max-w-none',
}

/**
 * Responsive page container: padding scales from mobile (320px+) through tablet/desktop/wide.
 * Use inside dashboard layout main for consistent gutters and max-width.
 */
export function DpsPageShell({
  variant = 'default',
  className,
  children,
}: {
  variant?: DpsPageShellVariant
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'w-full mx-auto',
        'px-k4 min-[375px]:px-k5 sm:px-k6 lg:px-k8',
        'py-k3 xs:py-k4 sm:py-k6 md:py-k8',
        maxWidthClass[variant],
        className
      )}
    >
      {children}
    </div>
  )
}

import { cn } from '@/lib/utils'

type LoadingSpinnerProps = {
  className?: string
  /** Announced to screen readers */
  label?: string
}

export function LoadingSpinner({ className, label = 'Loading' }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'inline-flex h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent',
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    />
  )
}

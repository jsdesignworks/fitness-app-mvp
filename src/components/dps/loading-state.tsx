import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type DpsLoadingStateProps = {
  label?: string
  className?: string
}

/**
 * Accessible loading region: spinner + visible text + screen reader live region.
 */
export function DpsLoadingState({
  label = 'Loading…',
  className,
}: DpsLoadingStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-touch items-center justify-center gap-2 rounded-lg border border-border bg-muted/20 px-4 py-8 text-muted-foreground',
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" aria-hidden />
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}

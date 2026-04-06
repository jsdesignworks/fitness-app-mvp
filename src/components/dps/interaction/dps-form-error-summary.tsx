import { cn } from '@/lib/utils'

export type DpsFormErrorSummaryProps = {
  message: string | null | undefined
  className?: string
}

/** Form-level validation or API error (single message). */
export function DpsFormErrorSummary({ message, className }: DpsFormErrorSummaryProps) {
  if (!message) return null
  return (
    <p role="alert" className={cn('text-k-sm text-destructive', className)}>
      {message}
    </p>
  )
}

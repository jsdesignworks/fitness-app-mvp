import { cn } from '@/lib/utils'

type ErrorMessageProps = {
  message: string
  className?: string
  /** destructive = errors; warning = non-blocking issues (e.g. prefs load) */
  variant?: 'destructive' | 'warning'
}

export function ErrorMessage({ message, className, variant = 'destructive' }: ErrorMessageProps) {
  return (
    <p
      className={cn(
        'text-sm',
        variant === 'destructive' && 'text-destructive',
        variant === 'warning' && 'text-amber-700 dark:text-amber-400',
        className
      )}
      role="alert"
    >
      {message}
    </p>
  )
}

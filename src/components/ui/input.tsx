import * as React from 'react'

import { cn } from '@/lib/utils'

export type InputVariant = 'default' | 'search' | 'number'

const inputVariantClass: Record<InputVariant, string> = {
  default: '',
  search: 'pl-9',
  number: 'tabular-nums',
}

export interface InputProps extends React.ComponentProps<'input'> {
  variant?: InputVariant
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = 'default', ...props }, ref) => {
    const resolvedType = type ?? (variant === 'search' ? 'search' : variant === 'number' ? 'number' : 'text')
    return (
      <input
        type={resolvedType}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-muted/40 px-3 py-2 text-k-sm text-foreground shadow-sm transition-colors',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:cursor-not-allowed disabled:opacity-50',
          inputVariantClass[variant],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }

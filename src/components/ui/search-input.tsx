import * as React from 'react'
import { Search } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

export type SearchInputProps = Omit<React.ComponentProps<typeof Input>, 'variant' | 'type'> & {
  label?: string
}

/**
 * Kinetic search field — icon + accessible label.
 */
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, label = 'Search', ...props }, ref) => {
    return (
      <div className={cn('relative w-full', className)}>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          ref={ref}
          variant="search"
          type="search"
          aria-label={label}
          className="w-full"
          {...props}
        />
      </div>
    )
  }
)
SearchInput.displayName = 'SearchInput'

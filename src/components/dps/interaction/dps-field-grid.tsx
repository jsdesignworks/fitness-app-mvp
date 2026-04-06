import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type DpsFieldGridProps = {
  children: ReactNode
  className?: string
  /** Default: 1 col mobile, 2 from sm */
  columns?: '1-sm2' | '1-sm2-md4' | '1-sm4'
}

const columnClass: Record<NonNullable<DpsFieldGridProps['columns']>, string> = {
  '1-sm2': 'grid-cols-1 sm:grid-cols-2',
  '1-sm2-md4': 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4',
  '1-sm4': 'grid-cols-1 sm:grid-cols-4',
}

/** Responsive grid for form fields inside cards. */
export function DpsFieldGrid({ children, className, columns = '1-sm2' }: DpsFieldGridProps) {
  return <div className={cn('grid gap-4', columnClass[columns], className)}>{children}</div>
}

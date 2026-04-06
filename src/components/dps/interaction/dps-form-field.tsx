'use client'

import * as React from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export type DpsFormFieldProps = {
  label: string
  /** If omitted, a stable `useId()` is used and merged into the child control. */
  htmlFor?: string
  hint?: string
  error?: string
  className?: string
  /** `dense` for compact grids (e.g. builder numeric cells). */
  size?: 'default' | 'dense'
  /** Single form control (Input, SelectTrigger, etc.) */
  children: React.ReactElement
}

const labelClassDefault =
  'text-k-sm font-medium text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
const labelClassDense =
  'text-xs font-medium text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70'

/**
 * Standard label + helper + inline error + a11y wiring (`aria-invalid`, `aria-describedby`).
 */
export function DpsFormField({
  label,
  htmlFor,
  hint,
  error,
  className,
  size = 'default',
  children,
}: DpsFormFieldProps) {
  const autoId = React.useId()
  const baseId = htmlFor ?? autoId
  const controlId = (children.props as { id?: string }).id ?? baseId
  const hintId = hint && !error ? `${controlId}-hint` : undefined
  const errId = error ? `${controlId}-error` : undefined
  const prevDescribedBy = (children.props as { 'aria-describedby'?: string })['aria-describedby']
  const describedBy =
    [prevDescribedBy, hintId, errId].filter(Boolean).join(' ').trim() || undefined

  const childProps = children.props as Record<string, unknown> & {
    className?: string
    'aria-invalid'?: boolean
  }
  const control = React.cloneElement(children, {
    ...childProps,
    id: controlId,
    'aria-invalid': error ? true : childProps['aria-invalid'],
    'aria-describedby': describedBy,
    className: cn(childProps.className, error && 'border-destructive focus-visible:ring-destructive'),
  } as never)

  return (
    <div className={cn(size === 'dense' ? 'space-y-1' : 'space-y-2', className)}>
      <Label htmlFor={controlId} className={size === 'dense' ? labelClassDense : labelClassDefault}>
        {label}
      </Label>
      {control}
      {hint && !error ? (
        <p id={hintId} className="text-k-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errId} className="text-k-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

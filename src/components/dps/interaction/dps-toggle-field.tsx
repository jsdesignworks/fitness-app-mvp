'use client'

import * as React from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

export type DpsToggleFieldProps = {
  id?: string
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

/**
 * Labeled switch row for settings forms (data-agnostic).
 */
export function DpsToggleField({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  className,
}: DpsToggleFieldProps) {
  const autoId = React.useId()
  const fieldId = id ?? autoId

  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 rounded-lg border border-border/60 bg-muted/15 px-3 py-3 transition-colors duration-kinetic',
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        <Label htmlFor={fieldId} className="cursor-pointer text-k-sm font-medium text-foreground">
          {label}
        </Label>
        {description ? <p className="text-k-xs text-muted-foreground">{description}</p> : null}
      </div>
      <Switch
        id={fieldId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="shrink-0"
      />
    </div>
  )
}

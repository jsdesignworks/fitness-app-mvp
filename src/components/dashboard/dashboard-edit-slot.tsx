'use client'

import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react'

type DashboardEditSlotProps = {
  widgetId: string
  title: string
  visible: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onToggleVisible: () => void
  editMode: boolean
  children: ReactNode
}

export function DashboardEditSlot({
  widgetId,
  title,
  visible,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onToggleVisible,
  editMode,
  children,
}: DashboardEditSlotProps) {
  if (!editMode) {
    return <>{children}</>
  }

  return (
    <div className="space-y-2" data-widget-slot={widgetId}>
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
        <span className="truncate font-display text-k-sm uppercase tracking-kinetic-wide text-foreground">
          {title}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            aria-label="Move up"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            aria-label="Move down"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button
            variant={visible ? 'secondary' : 'outline'}
            size="sm"
            onClick={onToggleVisible}
            className="gap-1"
            aria-label={visible ? 'Hide widget' : 'Show widget'}
          >
            {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {visible ? 'Visible' : 'Hidden'}
          </Button>
        </div>
      </div>
      {visible ? (
        children
      ) : (
        <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 py-8 text-center">
          <p className="text-sm text-muted-foreground">This widget is hidden. Toggle visible and save to show it.</p>
        </div>
      )}
    </div>
  )
}

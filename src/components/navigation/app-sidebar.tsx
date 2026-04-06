'use client'

import Link from 'next/link'
import { Activity } from 'lucide-react'
import { MainNavLinks } from '@/components/navigation/main-nav-links'
import { ThemeToggle } from '@/components/navigation/theme-toggle'

export function AppSidebar({ messageCount }: { messageCount: number }) {
  return (
    <aside className="hidden min-h-screen w-64 shrink-0 flex-col border-r border-border bg-card/95 backdrop-blur-sm lg:flex">
      <div className="flex h-14 shrink-0 items-center border-b border-border px-4">
        <Link
          href="/"
          className="dps-focus-ring flex items-center gap-2 font-display text-k-2xl uppercase tracking-kinetic-wide"
        >
          <Activity className="h-5 w-5 text-accent" aria-hidden />
          <span className="text-gradient-kinetic">Fitness</span>
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Main navigation">
        <MainNavLinks messageCount={messageCount} />
      </nav>
      <div className="shrink-0 border-t border-border p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-k-xs uppercase tracking-kinetic text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}

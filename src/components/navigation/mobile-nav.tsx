'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, Menu } from 'lucide-react'
import { MainNavLinks } from '@/components/navigation/main-nav-links'
import { ThemeToggle } from '@/components/navigation/theme-toggle'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

export function MobileNav({ messageCount }: { messageCount: number }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-2 border-b border-border/80 bg-card/95 px-k3 pb-k3 pt-[max(var(--space-3),env(safe-area-inset-top))] backdrop-blur-md lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button type="button" variant="ghost" size="icon" aria-label="Open menu" className="shrink-0">
            <Menu className="h-5 w-5" aria-hidden />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex h-full max-h-[100dvh] w-[min(100%-2rem,20rem)] flex-col gap-0 p-0 sm:max-w-sm">
          <SheetHeader className="border-b border-border px-4 py-4 text-left">
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-1 flex-col overflow-y-auto p-4" aria-label="Main navigation">
            <MainNavLinks messageCount={messageCount} onNavigate={() => setOpen(false)} />
          </nav>
          <div className="shrink-0 border-t border-border p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-k-xs uppercase tracking-kinetic text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <Link
        href="/"
        className="dps-focus-ring flex min-w-0 flex-1 items-center justify-center gap-2 py-1 font-display text-k-xl uppercase tracking-kinetic-wide"
      >
        <Activity className="h-5 w-5 shrink-0 text-accent" aria-hidden />
        <span className="text-gradient-kinetic truncate">Fitness</span>
      </Link>
      <ThemeToggle />
    </header>
  )
}

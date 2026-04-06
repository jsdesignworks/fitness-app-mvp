'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AppSidebar } from '@/components/navigation/app-sidebar'
import { MobileNav } from '@/components/navigation/mobile-nav'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [messageCount, setMessageCount] = useState(0)

  useEffect(() => {
    fetch('/api/messages?limit=1')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.unreadCount != null) setMessageCount(data.unreadCount)
      })
      .catch(() => {})
  }, [pathname])

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar messageCount={messageCount} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <MobileNav messageCount={messageCount} />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}

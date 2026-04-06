'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { MESSAGES_HREF, NAV_ITEMS, isNavActive } from '@/components/navigation/nav-config'

const linkBase =
  'dps-focus-ring relative flex w-full min-w-0 items-center gap-3 rounded-md border-l-2 border-transparent py-2 pl-3 pr-2 text-k-sm font-medium uppercase tracking-kinetic transition-colors duration-kinetic'

export function MainNavLinks({
  messageCount,
  onNavigate,
}: {
  messageCount: number
  onNavigate?: () => void
}) {
  const pathname = usePathname()

  return (
    <ul className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isNavActive(pathname, href)
        const showBadge = href === MESSAGES_HREF && messageCount > 0
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={() => onNavigate?.()}
              aria-current={active ? 'page' : undefined}
              className={cn(
                linkBase,
                active
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{label}</span>
              {showBadge && (
                <span
                  className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-kinetic-orange to-kinetic-pink px-1 text-[10px] font-bold text-white"
                  aria-label={`${messageCount} new messages`}
                >
                  {messageCount > 99 ? '99+' : messageCount}
                </span>
              )}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

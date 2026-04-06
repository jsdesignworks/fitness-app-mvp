import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Dumbbell,
  UtensilsCrossed,
  Calendar,
  MessageCircle,
  Bell,
  Target,
  TrendingUp,
} from 'lucide-react'

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Home', icon: LayoutDashboard },
  { href: '/workouts', label: 'Workouts', icon: Dumbbell },
  { href: '/nutrition', label: 'Nutrition', icon: UtensilsCrossed },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/habits', label: 'Habits', icon: Target },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/messages', label: 'Messages', icon: Bell },
  { href: '/chat', label: 'Chat', icon: MessageCircle },
]

export const MESSAGES_HREF = '/messages' as const

export function isNavActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  if (href === '/workouts') return pathname.startsWith('/workouts')
  if (href === '/nutrition') return pathname.startsWith('/nutrition')
  if (href === '/calendar') return pathname.startsWith('/calendar')
  if (href === '/habits') return pathname.startsWith('/habits')
  if (href === '/progress') return pathname.startsWith('/progress')
  if (href === '/messages') return pathname.startsWith('/messages')
  if (href === '/chat') return pathname.startsWith('/chat')
  return false
}

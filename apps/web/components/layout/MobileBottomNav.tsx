'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, TrendingUp, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MobileBottomNav() {
  const pathname = usePathname()

  const navItems = [
    {
      href: '/',
      icon: Home,
      label: 'Home',
    },
    {
      href: '/shows',
      icon: Calendar,
      label: 'Shows',
    },
    {
      href: '/trending',
      icon: TrendingUp,
      label: 'Trending',
    },
    {
      href: '/profile',
      icon: User,
      label: 'Profile',
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800">
      <div className="grid grid-cols-4 gap-1 px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors",
                isActive
                  ? "text-white"
                  : "text-gray-400 hover:text-gray-200"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  Music, 
  Calendar, 
  Settings, 
  TrendingUp,
  Database,
  Upload,
  Activity,
  Shield,
  ChevronLeft
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    description: 'Overview and metrics'
  },
  {
    name: 'User Management',
    href: '/admin/users',
    icon: Users,
    description: 'Manage users and roles'
  },
  {
    name: 'Artist Management',
    href: '/admin/artists',
    icon: Music,
    description: 'Import and manage artists'
  },
  {
    name: 'Show Management',
    href: '/admin/shows',
    icon: Calendar,
    description: 'Upcoming shows and events'
  },
  {
    name: 'Data Sync',
    href: '/admin/sync',
    icon: Database,
    description: 'External data synchronization'
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: TrendingUp,
    description: 'Platform analytics'
  },
  {
    name: 'System Health',
    href: '/admin/health',
    icon: Activity,
    description: 'System status and monitoring'
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    description: 'Platform configuration'
  }
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <motion.div
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Admin Panel
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              TheSet Management
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <motion.div
              key={item.name}
              whileHover={{ x: 4 }}
              transition={{ duration: 0.2 }}
            >
              <Link
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                <div className="relative z-10 flex items-center gap-4 w-full">
                  <item.icon className={cn(
                    "w-5 h-5 transition-colors",
                    isActive 
                      ? "text-white" 
                      : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                  )} />
                  
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      "font-medium transition-colors",
                      isActive 
                        ? "text-white" 
                        : "text-gray-900 dark:text-white group-hover:text-gray-900 dark:group-hover:text-white"
                    )}>
                      {item.name}
                    </div>
                    <div className={cn(
                      "text-xs transition-colors truncate",
                      isActive 
                        ? "text-white/80" 
                        : "text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                    )}>
                      {item.description}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium">Back to Site</span>
        </Link>
      </div>
    </motion.div>
  )
}
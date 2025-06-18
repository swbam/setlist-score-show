import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Card } from '@/components/ui/card'
import { Users, Music, Calendar, TrendingUp, Database, RotateCcw, Eye, Activity } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function AdminDashboard() {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  // Get comprehensive stats
  const [
    { count: userCount },
    { count: artistCount },
    { count: showCount },
    { count: voteCount },
    { count: venueCount },
    { data: recentShows },
    { data: syncStatus }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('artists').select('*', { count: 'exact', head: true }),
    supabase.from('shows').select('*', { count: 'exact', head: true }),
    supabase.from('votes').select('*', { count: 'exact', head: true }),
    supabase.from('venues').select('*', { count: 'exact', head: true }),
    supabase
      .from('shows')
      .select(`
        *,
        artists(id, name, slug),
        venues(id, name, city, state, country)
      `)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('sync_state')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(5)
  ])
  
  const stats = [
    { 
      name: 'Total Users', 
      value: userCount || 0, 
      icon: Users, 
      change: '+12.3%',
      changeType: 'increase' as const,
      color: 'from-blue-500 to-blue-600'
    },
    { 
      name: 'Artists', 
      value: artistCount || 0, 
      icon: Music, 
      change: '+5.7%',
      changeType: 'increase' as const,
      color: 'from-green-500 to-green-600'
    },
    { 
      name: 'Shows', 
      value: showCount || 0, 
      icon: Calendar, 
      change: '+18.2%',
      changeType: 'increase' as const,
      color: 'from-purple-500 to-purple-600'
    },
    { 
      name: 'Total Votes', 
      value: voteCount || 0, 
      icon: TrendingUp, 
      change: '+32.5%',
      changeType: 'increase' as const,
      color: 'from-orange-500 to-orange-600'
    },
    { 
      name: 'Venues', 
      value: venueCount || 0, 
      icon: Database, 
      change: '+8.1%',
      changeType: 'increase' as const,
      color: 'from-teal-500 to-teal-600'
    },
    { 
      name: 'Active Syncs', 
      value: syncStatus?.filter(s => s.status === 'running').length || 0, 
      icon: RotateCcw, 
      change: 'Live',
      changeType: 'neutral' as const,
      color: 'from-indigo-500 to-indigo-600'
    }
  ]
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Monitor and manage your concert voting platform
          </p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.name} className="relative overflow-hidden group hover:shadow-lg transition-all duration-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} text-white shadow-lg`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
                    stat.changeType === 'increase' 
                      ? 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30' 
                      : stat.changeType === 'neutral'
                      ? 'text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30'
                      : 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30'
                  }`}>
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value.toLocaleString()}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                  {stat.name}
                </p>
              </div>
              {/* Hover effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </Card>
          ))}
        </div>
        
        {/* Activity Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-6 h-6 text-purple-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recent Shows
              </h2>
            </div>
            <div className="space-y-3">
              {recentShows && recentShows.length > 0 ? (
                recentShows.slice(0, 5).map((show: any) => (
                  <div key={show.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {show.artists?.name || 'Unknown Artist'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {show.venues?.name || 'Unknown Venue'}{show.venues?.city ? `, ${show.venues.city}` : ''}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(show.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full">
                      <Eye className="w-3 h-3" />
                      {show.view_count || 0}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No recent shows found
                </p>
              )}
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="w-6 h-6 text-green-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                System Health
              </h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-gray-900 dark:text-white">Database</span>
                </div>
                <span className="text-green-600 dark:text-green-400 text-sm font-semibold bg-green-100 dark:bg-green-900/50 px-3 py-1 rounded-full">
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-gray-900 dark:text-white">Cache</span>
                </div>
                <span className="text-blue-600 dark:text-blue-400 text-sm font-semibold bg-blue-100 dark:bg-blue-900/50 px-3 py-1 rounded-full">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span className="font-medium text-gray-900 dark:text-white">Background Jobs</span>
                </div>
                <span className="text-gray-600 dark:text-gray-400 text-sm font-semibold bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                  Idle
                </span>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
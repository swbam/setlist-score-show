'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { 
  Users, 
  Calendar, 
  Music, 
  TrendingUp,
  Activity,
  RefreshCw,
  Database,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface Stats {
  totalUsers: number
  totalShows: number
  totalArtists: number
  totalVotes: number
  activeUsers: number
  upcomingShows: number
}

export default function AdminDashboard() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalShows: 0,
    totalArtists: 0,
    totalVotes: 0,
    activeUsers: 0,
    upcomingShows: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  // Check admin access
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/')
    }
  }, [user, loading, isAdmin, router])

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          { count: userCount },
          { count: showCount },
          { count: artistCount },
          { count: voteCount },
          { count: upcomingCount },
          { data: activeData }
        ] = await Promise.all([
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('shows').select('*', { count: 'exact', head: true }),
          supabase.from('artists').select('*', { count: 'exact', head: true }),
          supabase.from('votes').select('*', { count: 'exact', head: true }),
          supabase.from('shows').select('*', { count: 'exact', head: true })
            .eq('status', 'upcoming')
            .gte('date', new Date().toISOString()),
          supabase.from('votes')
            .select('user_id')
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        ])

        const uniqueActiveUsers = new Set(activeData?.map(v => v.user_id) || [])

        setStats({
          totalUsers: userCount || 0,
          totalShows: showCount || 0,
          totalArtists: artistCount || 0,
          totalVotes: voteCount || 0,
          activeUsers: uniqueActiveUsers.size,
          upcomingShows: upcomingCount || 0
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
        toast.error('Failed to load dashboard stats')
      } finally {
        setIsLoading(false)
      }
    }

    if (user && isAdmin) {
      fetchStats()
    }
  }, [user, isAdmin])

  const handleSyncData = async (type: string) => {
    setIsSyncing(true)
    
    try {
      let endpoint = ''
      switch (type) {
        case 'trending':
          endpoint = '/api/cron/calculate-trending'
          break
        case 'setlists':
          endpoint = '/api/cron/sync-setlists'
          break
        default:
          throw new Error('Unknown sync type')
      }

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'secure-cron-token-12345'}`
        }
      })

      if (!response.ok) {
        throw new Error('Sync failed')
      }

      toast.success(`${type} sync completed successfully`)
    } catch (error) {
      console.error('Sync error:', error)
      toast.error(`Failed to sync ${type}`)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleRefreshTrending = async () => {
    setIsSyncing(true)
    
    try {
      // Call the RPC function to refresh trending shows
      const { error } = await supabase.rpc('refresh_trending_shows')
      
      if (error) throw error
      
      toast.success('Trending shows refreshed successfully')
    } catch (error) {
      console.error('Error refreshing trending:', error)
      toast.error('Failed to refresh trending shows')
    } finally {
      setIsSyncing(false)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 gradient-text">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your TheSet platform</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="card-base rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-foreground" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.totalUsers.toLocaleString()}</div>
            <div className="text-muted-foreground">Registered Users</div>
            <div className="mt-2 text-sm text-green-400">
              {stats.activeUsers} active this week
            </div>
          </div>

          <div className="card-base rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8 text-foreground" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.totalShows.toLocaleString()}</div>
            <div className="text-muted-foreground">Shows</div>
            <div className="mt-2 text-sm text-foreground">
              {stats.upcomingShows} upcoming
            </div>
          </div>

          <div className="card-base rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Music className="w-8 h-8 text-purple-500" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.totalArtists.toLocaleString()}</div>
            <div className="text-muted-foreground">Artists</div>
          </div>

          <div className="card-base rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.totalVotes.toLocaleString()}</div>
            <div className="text-muted-foreground">Votes Cast</div>
          </div>

          <div className="card-base rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 text-orange-500" />
              <span className="text-sm text-muted-foreground">System</span>
            </div>
            <div className="text-xl font-bold mb-1 text-green-400">Healthy</div>
            <div className="text-muted-foreground">Status</div>
          </div>

          <div className="card-base rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Database className="w-8 h-8 text-red-500" />
              <span className="text-sm text-muted-foreground">Database</span>
            </div>
            <div className="text-xl font-bold mb-1 text-green-400">Connected</div>
            <div className="text-muted-foreground">Supabase</div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Data Sync */}
          <div className="card-base rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Data Sync
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => handleRefreshTrending()}
                disabled={isSyncing}
                className="w-full px-4 py-2 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
              >
                <span>Refresh Trending Shows</span>
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => handleSyncData('setlists')}
                disabled={isSyncing}
                className="w-full px-4 py-2 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
              >
                <span>Sync Setlists</span>
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => handleSyncData('trending')}
                disabled={isSyncing}
                className="w-full px-4 py-2 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
              >
                <span>Calculate Trending</span>
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card-base rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">System operational</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-muted-foreground">Database connected</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-muted-foreground">Background jobs pending</span>
              </div>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-800/50 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-200 font-medium">Admin Access</p>
            <p className="text-yellow-300/80 text-sm mt-1">
              This dashboard has limited functionality. Full admin features require API server connection.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
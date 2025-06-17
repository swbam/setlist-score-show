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
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2
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

const SYNC_JOBS = [
  {
    id: 'sync-homepage-orchestrator',
    name: 'Full Homepage Sync',
    description: 'Sync all artists, shows, and venues',
    icon: Database,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'sync-top-shows',
    name: 'Top Shows Sync',
    description: 'Import trending shows from external APIs',
    icon: Calendar,
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'sync-spotify',
    name: 'Spotify Sync',
    description: 'Update artist song catalogs from Spotify',
    icon: Music,
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'calculate-trending',
    name: 'Calculate Trending',
    description: 'Update trending shows and artists',
    icon: TrendingUp,
    color: 'from-orange-500 to-red-500'
  },
  {
    id: 'sync-setlists',
    name: 'Import Setlists',
    description: 'Import actual performed setlists',
    icon: RefreshCw,
    color: 'from-indigo-500 to-purple-500'
  },
  {
    id: 'fetch-top-artists',
    name: 'Fetch Top Artists',
    description: 'Import popular artists with upcoming shows',
    icon: Users,
    color: 'from-pink-500 to-rose-500'
  }
];

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
  const [running, setRunning] = useState<Record<string, boolean>>({})
  const [results, setResults] = useState<Record<string, 'success' | 'error'>>({})

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

  const triggerSync = async (jobId: string) => {
    setRunning(prev => ({ ...prev, [jobId]: true }));
    setResults(prev => ({ ...prev, [jobId]: undefined }));

    try {
      const response = await fetch(`/api/admin/trigger/${jobId}`, {
        method: 'POST'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to trigger sync');
      }

      setResults(prev => ({ ...prev, [jobId]: 'success' }));
      toast.success(`${jobId} has been triggered successfully`);
    } catch (error) {
      setResults(prev => ({ ...prev, [jobId]: 'error' }));
      toast.error(error.message || 'Sync failed');
    } finally {
      setRunning(prev => ({ ...prev, [jobId]: false }));
    }
  };

  const runAllSyncJobs = async () => {
    for (const job of SYNC_JOBS) {
      await triggerSync(job.id);
      // Add a small delay between jobs to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Manage your TheSet platform</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-900/50 border border-white/10 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-white" />
              <span className="text-sm text-gray-400">Total</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.totalUsers.toLocaleString()}</div>
            <div className="text-gray-400">Registered Users</div>
            <div className="mt-2 text-sm text-green-400">
              {stats.activeUsers} active this week
            </div>
          </div>

          <div className="bg-gray-900/50 border border-white/10 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8 text-white" />
              <span className="text-sm text-gray-400">Total</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.totalShows.toLocaleString()}</div>
            <div className="text-gray-400">Shows</div>
            <div className="mt-2 text-sm text-white">
              {stats.upcomingShows} upcoming
            </div>
          </div>

          <div className="bg-gray-900/50 border border-white/10 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <Music className="w-8 h-8 text-purple-500" />
              <span className="text-sm text-gray-400">Total</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.totalArtists.toLocaleString()}</div>
            <div className="text-gray-400">Artists</div>
          </div>

          <div className="bg-gray-900/50 border border-white/10 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <span className="text-sm text-gray-400">Total</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.totalVotes.toLocaleString()}</div>
            <div className="text-gray-400">Votes Cast</div>
          </div>

          <div className="bg-gray-900/50 border border-white/10 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 text-orange-500" />
              <span className="text-sm text-gray-400">System</span>
            </div>
            <div className="text-xl font-bold text-green-400 mb-1">Healthy</div>
            <div className="text-gray-400">Status</div>
          </div>

          <div className="bg-gray-900/50 border border-white/10 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <Database className="w-8 h-8 text-red-500" />
              <span className="text-sm text-gray-400">Database</span>
            </div>
            <div className="text-xl font-bold text-green-400 mb-1">Connected</div>
            <div className="text-gray-400">Supabase</div>
          </div>
        </div>

        {/* Admin Controls */}
        <div className="bg-gray-900/50 border border-white/10 rounded-lg p-6 backdrop-blur-sm">
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Admin Controls</h3>
              <p className="text-sm text-gray-400">
                Manually trigger data sync operations
              </p>
            </div>

            <div className="grid gap-4">
              {SYNC_JOBS.map((job) => {
                const Icon = job.icon;
                const isRunning = running[job.id];
                const result = results[job.id];

                return (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-black/50 border border-white/10"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${job.color}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{job.name}</h4>
                        <p className="text-sm text-gray-400">{job.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {result === 'success' && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {result === 'error' && (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      
                      <button
                        onClick={() => triggerSync(job.id)}
                        disabled={isRunning}
                        className="rounded-sm px-4 py-2 font-medium transition-all duration-200 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isRunning ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Running...
                          </>
                        ) : (
                          'Run'
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-white/10">
              <button
                onClick={runAllSyncJobs}
                className="w-full rounded-sm px-4 py-2 font-medium transition-all duration-200 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Run All Sync Jobs
              </button>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-800/50 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-200 font-medium">Admin Access</p>
            <p className="text-yellow-300/80 text-sm mt-1">
              Use sync jobs to update data from external APIs. Monitor the results carefully.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
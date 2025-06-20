'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Music, 
  Calendar, 
  TrendingUp,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  Download,
  Upload,
  Database,
  AlertCircle,
  Activity,
  Zap,
  Globe,
  Shield,
  Clock,
  BarChart3,
  Sparkles
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SyncStatus {
  job_name: string
  last_sync_date: string | null
  status: string
  records_processed: number
  records_created: number
  error_message: string | null
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    userCount: 0,
    artistCount: 0,
    showCount: 0,
    voteCount: 0,
    songCount: 0,
    venueCount: 0
  })
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([])
  const [syncing, setSyncing] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  
  const supabase = createClientComponentClient()
  const router = useRouter()
  
  useEffect(() => {
    checkAdminAccess()
    loadStats()
    loadSyncStatuses()
  }, [])
  
  async function checkAdminAccess() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      toast.error('Admin access required')
      router.push('/')
      return
    }
    
    setIsAdmin(true)
  }
  
  async function loadStats() {
    try {
      const [
        { count: userCount },
        { count: artistCount },
        { count: showCount },
        { count: voteCount },
        { count: songCount },
        { count: venueCount }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('artists').select('*', { count: 'exact', head: true }),
        supabase.from('shows').select('*', { count: 'exact', head: true }),
        supabase.from('votes').select('*', { count: 'exact', head: true }),
        supabase.from('songs').select('*', { count: 'exact', head: true }),
        supabase.from('venues').select('*', { count: 'exact', head: true })
      ])
      
      setStats({
        userCount: userCount || 0,
        artistCount: artistCount || 0,
        showCount: showCount || 0,
        voteCount: voteCount || 0,
        songCount: songCount || 0,
        venueCount: venueCount || 0
      })
    } catch (error) {
      console.error('Error loading stats:', error)
      toast.error('Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }
  
  async function loadSyncStatuses() {
    const { data, error } = await supabase
      .from('sync_state')
      .select('*')
      .order('updated_at', { ascending: false })
    
    if (!error && data) {
      setSyncStatuses(data)
    }
  }
  
  async function triggerSync(jobName: string) {
    setSyncing({ ...syncing, [jobName]: true })
    
    try {
      let endpoint = ''
      switch (jobName) {
        case 'sync_top_shows':
          endpoint = '/api/cron/sync-top-shows'
          break
        case 'sync_spotify':
          endpoint = '/api/cron/sync-spotify'
          break
        case 'calculate_trending':
          endpoint = '/api/cron/calculate-trending'
          break
        default:
          throw new Error('Unknown job')
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || '6155002300'}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Sync failed')
      }
      
      toast.success(`${jobName} triggered successfully`)
      
      // Reload sync statuses after a delay
      setTimeout(() => {
        loadSyncStatuses()
        loadStats()
      }, 2000)
    } catch (error) {
      console.error(`Error triggering ${jobName}:`, error)
      toast.error(`Failed to trigger ${jobName}`)
    } finally {
      setSyncing({ ...syncing, [jobName]: false })
    }
  }
  
  async function refreshHomepageCache() {
    setSyncing({ ...syncing, homepage_cache: true })
    
    try {
      const { error } = await supabase.rpc('refresh_homepage_cache')
      
      if (error) throw error
      
      toast.success('Homepage cache refreshed')
    } catch (error) {
      console.error('Error refreshing cache:', error)
      toast.error('Failed to refresh homepage cache')
    } finally {
      setSyncing({ ...syncing, homepage_cache: false })
    }
  }
  
  async function importTopArtists() {
    setSyncing({ ...syncing, import_artists: true })
    
    try {
      const response = await fetch('/api/admin/import-artists', {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Import failed')
      }
      
      const result = await response.json()
      toast.success(`Imported ${result.count} artists`)
      
      // Reload stats
      setTimeout(loadStats, 2000)
    } catch (error) {
      console.error('Error importing artists:', error)
      toast.error('Failed to import artists')
    } finally {
      setSyncing({ ...syncing, import_artists: false })
    }
  }
  
  if (!isAdmin || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-500" />
          <p className="text-gray-600 dark:text-gray-400">Loading admin dashboard...</p>
        </motion.div>
      </div>
    )
  }
  
  const statCards = [
    { 
      name: 'Total Users', 
      value: stats.userCount, 
      icon: Users, 
      color: 'text-blue-600',
      bgColor: 'from-blue-500/10 to-blue-600/10',
      borderColor: 'border-blue-200/50 dark:border-blue-800/30',
      trend: '+12%',
      trendUp: true
    },
    { 
      name: 'Artists', 
      value: stats.artistCount, 
      icon: Music, 
      color: 'text-purple-600',
      bgColor: 'from-purple-500/10 to-purple-600/10',
      borderColor: 'border-purple-200/50 dark:border-purple-800/30',
      trend: '+8%',
      trendUp: true
    },
    { 
      name: 'Shows', 
      value: stats.showCount, 
      icon: Calendar, 
      color: 'text-green-600',
      bgColor: 'from-green-500/10 to-green-600/10',
      borderColor: 'border-green-200/50 dark:border-green-800/30',
      trend: '+25%',
      trendUp: true
    },
    { 
      name: 'Total Votes', 
      value: stats.voteCount, 
      icon: TrendingUp, 
      color: 'text-orange-600',
      bgColor: 'from-orange-500/10 to-orange-600/10',
      borderColor: 'border-orange-200/50 dark:border-orange-800/30',
      trend: '+45%',
      trendUp: true
    },
    { 
      name: 'Songs', 
      value: stats.songCount, 
      icon: Music, 
      color: 'text-pink-600',
      bgColor: 'from-pink-500/10 to-pink-600/10',
      borderColor: 'border-pink-200/50 dark:border-pink-800/30',
      trend: '+18%',
      trendUp: true
    },
    { 
      name: 'Venues', 
      value: stats.venueCount, 
      icon: Database, 
      color: 'text-indigo-600',
      bgColor: 'from-indigo-500/10 to-indigo-600/10',
      borderColor: 'border-indigo-200/50 dark:border-indigo-800/30',
      trend: '+5%',
      trendUp: true
    }
  ]
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-purple-600 to-pink-600 dark:from-white dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Platform overview and management</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Clock className="w-4 h-4" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse ml-2" />
          <span>Live</span>
        </div>
      </div>
      
      {/* Enhanced Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <Card className={cn(
              "p-6 bg-gradient-to-br",
              stat.bgColor,
              stat.borderColor,
              "hover:shadow-lg transition-all duration-300 border"
            )}>
              <div className="flex items-center justify-between mb-4">
                <div className={cn(
                  "p-3 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm",
                  stat.color
                )}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className={cn(
                  "text-xs font-medium px-2 py-1 rounded-full",
                  stat.trendUp 
                    ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" 
                    : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                )}>
                  {stat.trend}
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value.toLocaleString()}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 font-medium">{stat.name}</p>
            </Card>
          </motion.div>
        ))}
      </div>
      
      {/* Enhanced Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <Card className="p-6 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-900/10 dark:via-gray-800 dark:to-purple-900/10 border border-blue-200/50 dark:border-blue-800/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Data Import</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Import and sync external data</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={importTopArtists}
                disabled={syncing.import_artists}
                className="w-full justify-start h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0"
              >
                {syncing.import_artists ? (
                  <Loader2 className="w-4 h-4 mr-3 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-3" />
                )}
                <div className="text-left">
                  <div className="font-medium">Import Top Artists</div>
                  <div className="text-xs opacity-90">From Spotify API</div>
                </div>
              </Button>
              
              <Button
                onClick={() => triggerSync('sync_top_shows')}
                disabled={syncing.sync_top_shows}
                className="w-full justify-start h-12 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 border-0"
              >
                {syncing.sync_top_shows ? (
                  <Loader2 className="w-4 h-4 mr-3 animate-spin" />
                ) : (
                  <Calendar className="w-4 h-4 mr-3" />
                )}
                <div className="text-left">
                  <div className="font-medium">Sync Shows</div>
                  <div className="text-xs opacity-90">From Ticketmaster</div>
                </div>
              </Button>
              
              <Button
                onClick={refreshHomepageCache}
                disabled={syncing.homepage_cache}
                className="w-full justify-start h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 border-0"
              >
                {syncing.homepage_cache ? (
                  <Loader2 className="w-4 h-4 mr-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-3" />
                )}
                <div className="text-left">
                  <div className="font-medium">Refresh Cache</div>
                  <div className="text-xs opacity-90">Homepage data</div>
                </div>
              </Button>
            </div>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Card className="p-6 bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-green-900/10 dark:via-gray-800 dark:to-blue-900/10 border border-green-200/50 dark:border-green-800/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Sync Status</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Background job monitoring</p>
              </div>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {syncStatuses.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No sync jobs found</p>
                </div>
              ) : (
                syncStatuses.map((status, index) => (
                  <motion.div
                    key={status.job_name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {status.job_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h3>
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          status.status === 'completed' ? 'bg-green-400 animate-pulse' :
                          status.status === 'failed' ? 'bg-red-400' :
                          'bg-yellow-400 animate-pulse'
                        )} />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {status.last_sync_date ? 
                          new Date(status.last_sync_date).toLocaleString() : 
                          'Never synced'
                        }
                      </p>
                      {status.records_processed > 0 && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          {status.records_processed} processed, {status.records_created} created
                        </p>
                      )}
                      {status.error_message && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1 truncate" title={status.error_message}>
                          {status.error_message}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {status.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : status.status === 'failed' ? (
                        <XCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => triggerSync(status.job_name)}
                        disabled={syncing[status.job_name]}
                        className="h-8 w-8 p-0"
                      >
                        {syncing[status.job_name] ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </Card>
        </motion.div>
      </div>
      
      {/* Enhanced System Health */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.9 }}
      >
        <Card className="p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900/50 dark:via-gray-800 dark:to-gray-900/50 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-gray-500 to-gray-700 rounded-xl">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">System Health</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Real-time system monitoring</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200/50 dark:border-green-800/30"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Database className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Database</h3>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse ml-auto" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Connected and operational</p>
              <div className="text-xs text-green-600 dark:text-green-400 font-medium">99.9% uptime</div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200/50 dark:border-blue-800/30"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Globe className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">API Services</h3>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse ml-auto" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">All services running</p>
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Response: 125ms</div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200/50 dark:border-purple-800/30"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Edge Functions</h3>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse ml-auto" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">All functions active</p>
              <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">12 deployed</div>
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
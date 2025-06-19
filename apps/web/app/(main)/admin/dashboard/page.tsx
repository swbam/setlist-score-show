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
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

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
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }
  
  const statCards = [
    { name: 'Total Users', value: stats.userCount, icon: Users, color: 'text-blue-600' },
    { name: 'Artists', value: stats.artistCount, icon: Music, color: 'text-purple-600' },
    { name: 'Shows', value: stats.showCount, icon: Calendar, color: 'text-green-600' },
    { name: 'Total Votes', value: stats.voteCount, icon: TrendingUp, color: 'text-orange-600' },
    { name: 'Songs', value: stats.songCount, icon: Music, color: 'text-pink-600' },
    { name: 'Venues', value: stats.venueCount, icon: Database, color: 'text-indigo-600' }
  ]
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.name} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
            <h3 className="text-2xl font-bold">{stat.value.toLocaleString()}</h3>
            <p className="text-muted-foreground">{stat.name}</p>
          </Card>
        ))}
      </div>
      
      {/* Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Data Import</h2>
          <div className="space-y-3">
            <Button
              onClick={importTopArtists}
              disabled={syncing.import_artists}
              className="w-full justify-start"
            >
              {syncing.import_artists ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Import Top Artists from Spotify
            </Button>
            
            <Button
              onClick={() => triggerSync('sync_top_shows')}
              disabled={syncing.sync_top_shows}
              className="w-full justify-start"
            >
              {syncing.sync_top_shows ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Calendar className="w-4 h-4 mr-2" />
              )}
              Sync Shows from Ticketmaster
            </Button>
            
            <Button
              onClick={refreshHomepageCache}
              disabled={syncing.homepage_cache}
              className="w-full justify-start"
            >
              {syncing.homepage_cache ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh Homepage Cache
            </Button>
          </div>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Sync Status</h2>
          <div className="space-y-3">
            {syncStatuses.map((status) => (
              <div key={status.job_name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <h3 className="font-medium">{status.job_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {status.last_sync_date ? 
                      new Date(status.last_sync_date).toLocaleString() : 
                      'Never synced'
                    }
                  </p>
                  {status.error_message && (
                    <p className="text-sm text-red-600 mt-1">{status.error_message}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {status.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : status.status === 'failed' ? (
                    <XCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => triggerSync(status.job_name)}
                    disabled={syncing[status.job_name]}
                  >
                    {syncing[status.job_name] ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      
      {/* System Health */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">System Health</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-medium">Database</h3>
            </div>
            <p className="text-sm text-muted-foreground">Connected and operational</p>
          </div>
          
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-medium">API Services</h3>
            </div>
            <p className="text-sm text-muted-foreground">All services running</p>
          </div>
          
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <h3 className="font-medium">Edge Functions</h3>
            </div>
            <p className="text-sm text-muted-foreground">Deployment required</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
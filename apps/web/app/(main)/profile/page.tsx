'use client'

import { useAuth } from '@/hooks/useAuth'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { useRouter } from 'next/navigation'
import { User, Music, Vote, Calendar, LogOut, Settings } from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { user, loading, signOut, isAdmin } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [syncStatus, setSyncStatus] = useState<{ [key: string]: { loading: boolean; message?: string } }>({})
  
  const handleSync = async (functionName: string, displayName: string) => {
    setSyncStatus(prev => ({ ...prev, [functionName]: { loading: true } }))
    
    try {
      // Use the new secure admin API route
      const response = await fetch(`/api/admin/trigger/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success(`${displayName} completed successfully`)
        setSyncStatus(prev => ({ 
          ...prev, 
          [functionName]: { 
            loading: false, 
            message: data.message || 'Completed successfully' 
          } 
        }))
      } else {
        throw new Error(data.error || data.message || 'Sync failed')
      }
    } catch (error) {
      toast.error(`${displayName} failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setSyncStatus(prev => ({ 
        ...prev, 
        [functionName]: { 
          loading: false, 
          message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
        } 
      }))
    }
  }

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null
  }

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut()
      toast.success('Signed out successfully')
      router.push('/')
    } catch (error) {
      toast.error('Failed to sign out')
    } finally {
      setIsLoading(false)
    }
  }

  const [stats, setStats] = useState({
    totalVotes: 0,
    showsVoted: 0,
    artistsFollowed: 0,
    memberSince: new Date(user.created_at || Date.now()).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    })
  })

  // Fetch user stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return
      
      try {
        const { supabase } = await import('@/lib/supabase')
        
        // Get total votes
        const { count: voteCount } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
        
        // Get unique shows voted on
        const { data: showsData } = await supabase
          .from('votes')
          .select('show_id')
          .eq('user_id', user.id)
        
        const uniqueShows = new Set(showsData?.map(v => v.show_id) || [])
        
        // Get artists followed
        const { count: artistCount } = await supabase
          .from('user_follows_artist')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
        
        setStats({
          totalVotes: voteCount || 0,
          showsVoted: uniqueShows.size,
          artistsFollowed: artistCount || 0,
          memberSince: new Date(user.created_at || Date.now()).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
          })
        })
      } catch (error) {
        console.error('Error fetching user stats:', error)
      }
    }
    
    fetchStats()
  }, [user])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="card-base rounded-[2px] p-8 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-muted/20 rounded-[2px] flex items-center justify-center">
              <User className="w-12 h-12 text-foreground" />
            </div>
            <div className="text-foreground">
              <h1 className="text-3xl font-bold mb-2">{user.email}</h1>
              <p className="text-muted-foreground">Member since {stats.memberSince}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card-base rounded-[2px] p-6">
            <Vote className="w-8 h-8 text-muted-foreground mb-4" />
            <div className="text-3xl font-bold mb-1">{stats.totalVotes}</div>
            <div className="text-muted-foreground">Total Votes</div>
          </div>
          
          <div className="card-base rounded-[2px] p-6">
            <Calendar className="w-8 h-8 text-muted-foreground mb-4" />
            <div className="text-3xl font-bold mb-1">{stats.showsVoted}</div>
            <div className="text-muted-foreground">Shows Voted</div>
          </div>
          
          <div className="card-base rounded-[2px] p-6">
            <Music className="w-8 h-8 text-primary mb-4" />
            <div className="text-3xl font-bold mb-1">{stats.artistsFollowed}</div>
            <div className="text-muted-foreground">Artists Followed</div>
          </div>
          
          <div className="card-base rounded-[2px] p-6">
            <User className="w-8 h-8 text-green-500 mb-4" />
            <div className="text-xl font-bold mb-1">Active</div>
            <div className="text-muted-foreground">Account Status</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account Settings */}
          <div className="card-base rounded-[2px] p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Account Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Email</label>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">User ID</label>
                <p className="font-mono text-sm text-muted-foreground/70">{user.id}</p>
              </div>
              {user.app_metadata?.provider && (
                <div>
                  <label className="text-sm text-muted-foreground">Login Method</label>
                  <p className="font-medium capitalize">{user.app_metadata.provider}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="card-base rounded-[2px] p-6">
            <h2 className="text-xl font-bold mb-4">Quick Links</h2>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/my-artists')}
                className="w-full text-left px-4 py-3 bg-muted/20 rounded-[2px] hover:bg-muted/30 transition-colors flex items-center justify-between min-h-[48px]"
              >
                <span>My Artists</span>
                <span className="text-muted-foreground">→</span>
              </button>
              <button
                onClick={() => router.push('/shows')}
                className="w-full text-left px-4 py-3 bg-muted/20 rounded-[2px] hover:bg-muted/30 transition-colors flex items-center justify-between min-h-[48px]"
              >
                <span>Browse Shows</span>
                <span className="text-muted-foreground">→</span>
              </button>
              <button
                onClick={() => router.push('/trending')}
                className="w-full text-left px-4 py-3 bg-muted/20 rounded-[2px] hover:bg-muted/30 transition-colors flex items-center justify-between min-h-[48px]"
              >
                <span>Trending Shows</span>
                <span className="text-muted-foreground">→</span>
              </button>
            </div>
          </div>
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <div className="mt-8 card-base rounded-[2px] p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Admin Controls
            </h2>
            <p className="text-gray-400 mb-6">Manually trigger sync functions and cron jobs</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <button
                  onClick={() => handleSync('sync-top-shows', 'Sync Top Shows')}
                  disabled={syncStatus['sync-top-shows']?.loading}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-[2px] hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center min-h-[48px]"
                >
                  {syncStatus['sync-top-shows']?.loading ? 'Syncing...' : 'Sync Top Shows'}
                </button>
                {syncStatus['sync-top-shows']?.message && (
                  <p className="text-sm text-muted-foreground mt-2">{syncStatus['sync-top-shows'].message}</p>
                )}
              </div>
              
              <div>
                <button
                  onClick={() => handleSync('sync-artists', 'Sync Artists')}
                  disabled={syncStatus['sync-artists']?.loading}
                  className="w-full px-4 py-3 bg-purple-600 text-white rounded-[2px] hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center min-h-[48px]"
                >
                  {syncStatus['sync-artists']?.loading ? 'Syncing...' : 'Sync Artists'}
                </button>
                {syncStatus['sync-artists']?.message && (
                  <p className="text-sm text-muted-foreground mt-2">{syncStatus['sync-artists'].message}</p>
                )}
              </div>
              
              <div>
                <button
                  onClick={() => handleSync('sync-spotify', 'Sync Spotify')}
                  disabled={syncStatus['sync-spotify']?.loading}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-[2px] hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center min-h-[48px]"
                >
                  {syncStatus['sync-spotify']?.loading ? 'Syncing...' : 'Sync Spotify'}
                </button>
                {syncStatus['sync-spotify']?.message && (
                  <p className="text-sm text-muted-foreground mt-2">{syncStatus['sync-spotify'].message}</p>
                )}
              </div>
              
              <div>
                <button
                  onClick={() => handleSync('calculate-trending', 'Calculate Trending')}
                  disabled={syncStatus['calculate-trending']?.loading}
                  className="w-full px-4 py-3 bg-orange-600 text-white rounded-[2px] hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center min-h-[48px]"
                >
                  {syncStatus['calculate-trending']?.loading ? 'Calculating...' : 'Calculate Trending'}
                </button>
                {syncStatus['calculate-trending']?.message && (
                  <p className="text-sm text-muted-foreground mt-2">{syncStatus['calculate-trending'].message}</p>
                )}
              </div>
              
              <div>
                <button
                  onClick={() => handleSync('refresh_trending_shows', 'Refresh Trending Shows')}
                  disabled={syncStatus['refresh_trending_shows']?.loading}
                  className="w-full px-4 py-3 bg-teal-600 text-white rounded-[2px] hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center min-h-[48px]"
                >
                  {syncStatus['refresh_trending_shows']?.loading ? 'Refreshing...' : 'Refresh Trending Shows'}
                </button>
                {syncStatus['refresh_trending_shows']?.message && (
                  <p className="text-sm text-muted-foreground mt-2">{syncStatus['refresh_trending_shows'].message}</p>
                )}
              </div>
              
              <div>
                <button
                  onClick={() => handleSync('sync-setlists', 'Sync Setlists')}
                  disabled={syncStatus['sync-setlists']?.loading}
                  className="w-full px-4 py-3 bg-pink-600 text-white rounded-[2px] hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center min-h-[48px]"
                >
                  {syncStatus['sync-setlists']?.loading ? 'Syncing...' : 'Sync Setlists'}
                </button>
                {syncStatus['sync-setlists']?.message && (
                  <p className="text-sm text-muted-foreground mt-2">{syncStatus['sync-setlists'].message}</p>
                )}
              </div>
              
              <div>
                <button
                  onClick={() => handleSync('fetch-top-artists', 'Fetch Top Artists')}
                  disabled={syncStatus['fetch-top-artists']?.loading}
                  className="w-full px-4 py-3 bg-indigo-600 text-white rounded-[2px] hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center min-h-[48px]"
                >
                  {syncStatus['fetch-top-artists']?.loading ? 'Fetching...' : 'Fetch Top Artists'}
                </button>
                {syncStatus['fetch-top-artists']?.message && (
                  <p className="text-sm text-muted-foreground mt-2">{syncStatus['fetch-top-artists'].message}</p>
                )}
              </div>
              
              <div>
                <button
                  onClick={() => handleSync('sync-homepage-orchestrator', 'Run Full Sync Orchestrator')}
                  disabled={syncStatus['sync-homepage-orchestrator']?.loading}
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-[2px] hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center min-h-[48px]"
                >
                  {syncStatus['sync-homepage-orchestrator']?.loading ? 'Orchestrating...' : 'Run Full Sync Orchestrator'}
                </button>
                {syncStatus['sync-homepage-orchestrator']?.message && (
                  <p className="text-sm text-muted-foreground mt-2">{syncStatus['sync-homepage-orchestrator'].message}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sign Out Button */}
        <div className="mt-8">
          <button
            onClick={handleSignOut}
            disabled={isLoading}
            className="px-6 py-3 bg-red-600 text-white rounded-[2px] font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-h-[48px]"
          >
            <LogOut className="w-5 h-5" />
            {isLoading ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </div>
    </div>
  )
}
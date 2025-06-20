'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Loader2, Music, Calendar, MapPin, ExternalLink, Users, Download, RefreshCw, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface SpotifyArtist {
  id: string
  name: string
  images: { url: string }[]
  genres: string[]
  followers: { total: number }
}

interface ImportProgress {
  stage: 'connecting' | 'fetching' | 'artists' | 'shows' | 'complete'
  current: number
  total: number
  message: string
}

interface MyArtist {
  id: string
  name: string
  slug: string
  image_url?: string
  genres: string[]
  followers?: number
  spotify_id?: string
  upcomingShows?: {
    id: string
    date: string
    title: string
    venue: {
      name: string
      city: string
      state?: string
      country: string
    }
    total_votes?: number
  }[]
}

export default function MyArtistsPage() {
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [myArtists, setMyArtists] = useState<MyArtist[]>([])
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [isLoadingArtists, setIsLoadingArtists] = useState(true)
  const [lastImportDate, setLastImportDate] = useState<string | null>(null)
  const supabase = createClientComponentClient()
  const router = useRouter()
  
  useEffect(() => {
    checkUser()
    loadMyArtists()
    
    // Check if we should trigger import after Spotify OAuth
    const params = new URLSearchParams(window.location.search)
    if (params.get('action') === 'import') {
      // Clean URL and trigger import
      const cleanUrl = window.location.pathname
      window.history.replaceState({}, '', cleanUrl)
      
      // Trigger import after a short delay to ensure session is loaded
      setTimeout(() => {
        importFromSpotify()
      }, 1000)
    }
  }, [])
  
  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    // Don't redirect - let users see the page content and login from here
  }
  
  async function loadMyArtists() {
    setIsLoadingArtists(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsLoadingArtists(false)
      return
    }
    
    try {
      // Get user's followed artists with upcoming shows
      const { data, error } = await supabase
        .from('user_artists')
        .select(`
          created_at,
          artist:artists(
            id,
            name,
            slug,
            image_url,
            genres,
            followers,
            spotify_id,
            shows!inner(
              id,
              date,
              title,
              status,
              venue:venues(
                name,
                city,
                state,
                country
              ),
              setlists(
                setlist_songs(
                  vote_count
                )
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('artists.shows.status', 'upcoming')
        .gte('artists.shows.date', new Date().toISOString())
        .order('created_at', { ascending: false })
      
      if (error) throw error

      // Transform the data
      const artistsWithShows = data?.map((item: any) => {
        const artist = item.artist
        const upcomingShows = artist.shows?.map((show: any) => ({
          id: show.id,
          date: show.date,
          title: show.title || `${artist.name} at ${show.venue?.name}`,
          venue: show.venue,
          total_votes: show.setlists?.reduce((sum: number, setlist: any) => 
            sum + (setlist.setlist_songs?.reduce((songSum: number, song: any) => 
              songSum + (song.vote_count || 0), 0) || 0), 0) || 0
        })) || []

        return {
          ...artist,
          upcomingShows: upcomingShows.sort((a: any, b: any) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          ).slice(0, 3) // Show only next 3 shows
        }
      }) || []
      
      setMyArtists(artistsWithShows.filter(artist => artist.upcomingShows.length > 0))
      
      // Get last import date
      if (data && data.length > 0) {
        const latestImport = data.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]
        setLastImportDate(latestImport.created_at)
      }
    } catch (err: any) {
      console.error('Error loading artists:', err)
      setError('Failed to load your artists')
    } finally {
      setIsLoadingArtists(false)
    }
  }
  
  async function importFromSpotify() {
    setIsImporting(true)
    setError(null)
    
    try {
      // Always start with Spotify OAuth for a fresh login
      setProgress({
        stage: 'connecting',
        current: 0,
        total: 1,
        message: 'Connecting to Spotify...'
      })
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'spotify',
        options: {
          scopes: 'user-follow-read user-top-read user-library-read',
          redirectTo: `${window.location.origin}/auth/callback?redirect=/my-artists&action=import`
        }
      })
      if (error) throw error
      return
      
    } catch (err: any) {
      console.error('Import error:', err)
      setError(err.message || 'Failed to import from Spotify')
      setIsImporting(false)
      setProgress(null)
    }
  }
  


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatLastImport = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) return 'Less than an hour ago'
    if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`
    if (diffInHours < 48) return 'Yesterday'
    return date.toLocaleDateString()
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Import Loading Overlay */}
      {isImporting && progress && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="flex flex-col items-center">
              <div className="relative mb-6">
                {progress.stage === 'complete' ? (
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 bg-white rounded-full" />
                  </div>
                ) : (
                  <Loader2 className="w-16 h-16 text-primary animate-spin" />
                )}
              </div>
              
              <h3 className="text-xl font-semibold mb-2">
                {progress.stage === 'complete' ? 'Import Complete!' : 'Importing from Spotify'}
              </h3>
              
              <p className="text-muted-foreground text-center mb-6">
                {progress.message}
              </p>
              
              {progress.stage !== 'complete' && progress.total > 0 && (
                <>
                  <div className="w-full bg-muted rounded-full h-2 mb-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {progress.current} of {progress.total}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Artists</h1>
          <p className="text-muted-foreground">
            Import your Spotify artists and track their upcoming shows and voting activity.
          </p>
        </div>

        {/* Import Section */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-green-500" />
                Spotify Integration
              </h2>
              <p className="text-muted-foreground mb-2">
                Connect your Spotify account to automatically import artists you follow and get personalized show recommendations.
              </p>
              {lastImportDate && (
                <p className="text-sm text-muted-foreground">
                  Last import: {formatLastImport(lastImportDate)}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                onClick={importFromSpotify}
                disabled={isImporting}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {myArtists.length > 0 ? 'Sync Again' : 'Import from Spotify'}
              </Button>
              {myArtists.length > 0 && (
                <Button
                  onClick={loadMyArtists}
                  variant="outline"
                  disabled={isLoadingArtists}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={cn("w-4 h-4", isLoadingArtists && "animate-spin")} />
                  Refresh
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Import Progress */}
        {isImporting && progress && (
          <Card className="p-6 mb-8 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-green-600" />
                <h3 className="font-semibold text-green-800 dark:text-green-200">
                  {progress.stage === 'connecting' && 'Connecting to Spotify'}
                  {progress.stage === 'fetching' && 'Finding Your Artists'}
                  {progress.stage === 'artists' && 'Importing Artists'}
                  {progress.stage === 'shows' && 'Loading Show Data'}
                  {progress.stage === 'complete' && 'Import Complete! ✨'}
                </h3>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-green-700 dark:text-green-300">
                  <span>{progress.message}</span>
                  {progress.total > 0 && (
                    <span>{progress.current}/{progress.total}</span>
                  )}
                </div>
                
                {progress.total > 0 && (
                  <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="p-6 mb-8 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <p className="font-medium">Error: {error}</p>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {isLoadingArtists && !isImporting && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse">
                  <div className="w-16 h-16 bg-muted rounded-full mb-4" />
                  <div className="h-4 bg-muted rounded mb-2" />
                  <div className="h-3 bg-muted rounded w-2/3 mb-4" />
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded" />
                    <div className="h-3 bg-muted rounded w-3/4" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoadingArtists && myArtists.length === 0 && !error && (
          <div className="text-center py-12">
            <Music className="w-24 h-24 text-muted-foreground mx-auto mb-6" />
            <h2 className="text-2xl font-semibold mb-4">No Artists Yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Import your favorite artists from Spotify to track their upcoming shows and participate in setlist voting.
            </p>
            <Button 
              onClick={importFromSpotify} 
              disabled={isImporting}
              className="bg-gray-800 hover:bg-gray-700 text-white font-semibold px-8 py-4 rounded-xl flex items-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {progress?.message || 'Importing...'}
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Find My Artists on Tour
                </>
              )}
            </Button>
          </div>
        )}

        {/* Artists Grid */}
        {!isLoadingArtists && myArtists.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myArtists.map((artist) => (
              <Card key={artist.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4 mb-4">
                  {artist.image_url ? (
                    <img
                      src={artist.image_url}
                      alt={artist.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <Music className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{artist.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {artist.followers && (
                        <>
                          <Users className="w-3 h-3" />
                          <span>{artist.followers.toLocaleString()}</span>
                        </>
                      )}
                    </div>
                    {artist.genres && artist.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {artist.genres.slice(0, 2).map((genre) => (
                          <Badge key={genre} variant="secondary" className="text-xs">
                            {genre}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Upcoming Shows */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Upcoming Shows ({artist.upcomingShows?.length || 0})
                  </h4>
                  
                  {artist.upcomingShows && artist.upcomingShows.length > 0 ? (
                    <div className="space-y-2">
                      {artist.upcomingShows.map((show) => (
                        <Link
                          key={show.id}
                          href={`/shows/${show.id}`}
                          className="block p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">{show.title}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(show.date)}</span>
                                <MapPin className="w-3 h-3 ml-1" />
                                <span className="truncate">{show.venue.city}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge variant="outline" className="text-xs">
                                {show.total_votes || 0} votes
                              </Badge>
                              <ExternalLink className="w-3 h-3 text-muted-foreground" />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No upcoming shows scheduled
                    </p>
                  )}
                </div>

                {/* Artist Actions */}
                <div className="flex gap-2 mt-4">
                  <Link
                    href={`/artists/${artist.slug}`}
                    className="btn-outline flex-1 text-center"
                  >
                    View Artist
                  </Link>
                  {artist.spotify_id && (
                    <a
                      href={`https://open.spotify.com/artist/${artist.spotify_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline px-3"
                      title="Open in Spotify"
                    >
                      <Music className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {myArtists.length > 0 && (
          <Card className="p-6 mt-8">
            <h3 className="font-semibold mb-4">Your Collection Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{myArtists.length}</div>
                <div className="text-sm text-muted-foreground">Artists</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {myArtists.reduce((sum, artist) => sum + (artist.upcomingShows?.length || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Upcoming Shows</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {myArtists.reduce((sum, artist) => 
                    sum + (artist.upcomingShows?.reduce((showSum, show) => 
                      showSum + (show.total_votes || 0), 0) || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Votes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {new Set(myArtists.flatMap(artist => artist.genres || [])).size}
                </div>
                <div className="text-sm text-muted-foreground">Genres</div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
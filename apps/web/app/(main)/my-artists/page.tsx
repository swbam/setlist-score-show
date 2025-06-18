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
  }, [])
  
  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (!user) {
      router.push('/login')
    }
  }
  
  async function loadMyArtists() {
    setIsLoadingArtists(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
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
      // Stage 1: Connect to Spotify
      setProgress({
        stage: 'connecting',
        current: 0,
        total: 1,
        message: 'Connecting to Spotify...'
      })

      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.provider_token) {
        // Re-authenticate with Spotify
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'spotify',
          options: {
            scopes: 'user-follow-read user-top-read user-library-read',
            redirectTo: `${window.location.origin}/my-artists?import=true`
          }
        })
        if (error) throw error
        return
      }
      
      // Stage 2: Fetch followed artists from Spotify
      setProgress({
        stage: 'fetching',
        current: 0,
        total: 0,
        message: 'Fetching your Spotify artists...'
      })
      
      const followedArtists = await fetchAllFollowedArtists(session.provider_token)
      
      if (followedArtists.length === 0) {
        throw new Error('No followed artists found on Spotify')
      }

      setProgress({
        stage: 'artists',
        current: 0,
        total: followedArtists.length,
        message: `Processing ${followedArtists.length} artists...`
      })
      
      // Stage 3: Import artists
      const importedArtists = []
      
      for (let i = 0; i < followedArtists.length; i++) {
        const spotifyArtist = followedArtists[i]
        
        setProgress({
          stage: 'artists',
          current: i + 1,
          total: followedArtists.length,
          message: `Importing ${spotifyArtist.name}...`
        })
        
        // Create or update artist
        const { data: artist, error: artistError } = await supabase
          .from('artists')
          .upsert({
            spotify_id: spotifyArtist.id,
            name: spotifyArtist.name,
            slug: spotifyArtist.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
            image_url: spotifyArtist.images[0]?.url,
            genres: spotifyArtist.genres,
            followers: spotifyArtist.followers.total,
            popularity: Math.min(100, Math.max(0, Math.floor(spotifyArtist.followers.total / 100000))),
            last_synced_at: new Date().toISOString(),
          }, {
            onConflict: 'spotify_id'
          })
          .select()
          .single()
        
        if (artist && !artistError) {
          // Link to user (insert or ignore if exists)
          const { error: linkError } = await supabase
            .from('user_artists')
            .upsert({
              user_id: user.id,
              artist_id: artist.id,
              created_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,artist_id',
              ignoreDuplicates: true
            })
          
          if (!linkError) {
            importedArtists.push(artist)
          }
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      setProgress({
        stage: 'complete',
        current: importedArtists.length,
        total: importedArtists.length,
        message: `Import complete! Added ${importedArtists.length} artists to your collection.`
      })
      
      // Reload the page data
      await loadMyArtists()
      
      setTimeout(() => {
        setIsImporting(false)
        setProgress(null)
      }, 3000)
      
    } catch (err: any) {
      console.error('Import error:', err)
      setError(err.message || 'Failed to import from Spotify')
      setIsImporting(false)
      setProgress(null)
    }
  }
  
  async function fetchAllFollowedArtists(token: string): Promise<SpotifyArtist[]> {
    const artists: SpotifyArtist[] = []
    let url = 'https://api.spotify.com/v1/me/following?type=artist&limit=50'
    
    while (url) {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`Spotify API error: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      artists.push(...data.artists.items)
      url = data.artists.next
    }
    
    return artists
  }
  
  // Check if we're returning from Spotify auth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('import') === 'true') {
      importFromSpotify()
      router.replace('/my-artists')
    }
  }, [])

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
            <Button onClick={importFromSpotify} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Import from Spotify
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
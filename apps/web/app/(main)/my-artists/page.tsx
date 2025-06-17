'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import { 
  Music, 
  Calendar, 
  Users, 
  Star, 
  TrendingUp, 
  Plus,
  ExternalLink,
  ArrowRight,
  Loader2,
  RefreshCw,
  SparklesIcon as Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { ShowCard } from '@/components/shows/ShowCard'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Artist {
  id: string
  name: string
  slug: string
  image_url?: string
  genres: string[]
  popularity: number
  followers?: number
  upcoming_shows?: number
  last_synced_at?: string
}

interface UpcomingShow {
  id: string
  title?: string
  date: string
  status: string
  artist: {
    id: string
    name: string
    slug: string
    imageUrl?: string
  }
  venue: {
    id: string
    name: string
    city: string
    state?: string
    country?: string
  }
  _count?: {
    votes: number
  }
}

export default function MyArtistsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isImporting, setIsImporting] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Fetch user's followed artists
  const { data: artistsData, isLoading: isLoadingArtists, refetch: refetchArtists } = useQuery({
    queryKey: ['my-artists', user?.id],
    queryFn: async () => {
      if (!user) return []
      
      const { data, error } = await supabase
        .from('spotify_top_artists')
        .select(`
          rank,
          artists (
            id,
            name,
            slug,
            image_url,
            genres,
            popularity,
            followers,
            last_synced_at
          )
        `)
        .eq('user_id', user.id)
        .order('rank', { ascending: true })

      if (error) throw error

      // Get upcoming shows count for each artist
      const artistIds = data?.map(item => item.artists.id).filter(Boolean) || []
      
      if (artistIds.length > 0) {
        const { data: showCounts } = await supabase
          .from('shows')
          .select('artist_id')
          .in('artist_id', artistIds)
          .eq('status', 'upcoming')
          .gte('date', new Date().toISOString().split('T')[0])

        const showCountMap = showCounts?.reduce((acc, show) => {
          acc[show.artist_id] = (acc[show.artist_id] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}

        return data?.map(item => ({
          ...(item.artists as any),
          rank: item.rank,
          upcoming_shows: showCountMap[(item.artists as any).id] || 0
        })) || []
      }

      return data?.map(item => ({
        ...(item.artists as any),
        rank: item.rank,
        upcoming_shows: 0
      })) || []
    },
    enabled: !!user
  })

  // Fetch upcoming shows from followed artists
  const { data: upcomingShows, isLoading: isLoadingShows } = useQuery({
    queryKey: ['my-artists-shows', user?.id],
    queryFn: async () => {
      if (!user || !artistsData?.length) return []
      
      const artistIds = (artistsData as any[]).map((artist: any) => artist.id)
      
      const { data, error } = await supabase
        .from('shows')
        .select(`
          id,
          title,
          date,
          status,
          artists (
            id,
            name,
            slug,
            image_url
          ),
          venues (
            id,
            name,
            city,
            state,
            country
          ),
          setlists (
            id,
            setlist_songs (
              vote_count
            )
          )
        `)
        .in('artist_id', artistIds)
        .eq('status', 'upcoming')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(12)

      if (error) throw error

      return data?.map(show => ({
        ...show,
        artist: {
          id: (show.artists as any).id,
          name: (show.artists as any).name,
          slug: (show.artists as any).slug,
          imageUrl: (show.artists as any).image_url
        },
        venue: {
          id: (show.venues as any).id,
          name: (show.venues as any).name,
          city: (show.venues as any).city,
          state: (show.venues as any).state,
          country: (show.venues as any).country
        },
        _count: {
          votes: show.setlists?.[0]?.setlist_songs?.reduce((sum, song) => sum + (song.vote_count || 0), 0) || 0
        }
      })) || []
    },
    enabled: !!user && !!artistsData?.length
  })

  const handleImportFromSpotify = async () => {
    if (!user) {
      toast.error('Please sign in to import artists')
      return
    }

    setIsImporting(true)
    
    try {
      // Call the sync function
      const response = await fetch('/api/admin/trigger/sync-spotify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to sync Spotify data')
      }

      const data = await response.json()
      
      if (data.success) {
        toast.success('Successfully imported your top artists from Spotify!')
        refetchArtists()
      } else {
        throw new Error(data.error || 'Sync failed')
      }
    } catch (error) {
      console.error('Import error:', error)
      toast.error('Failed to import Spotify artists. Please try again.')
    } finally {
      setIsImporting(false)
    }
  }

  if (loading) {
    return <MyArtistsPageSkeleton />
  }

  if (!user) {
    return null
  }

  const artists = artistsData || []
  const totalUpcomingShows = artists.reduce((sum, artist) => sum + (artist.upcoming_shows || 0), 0)

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 flex items-center gap-3">
                <div className="p-2 rounded-sm bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  <Star className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
                </div>
                My Artists
              </h1>
              <p className="text-lg sm:text-xl text-white/70">
                {artists.length > 0 
                  ? `Following ${artists.length} artist${artists.length !== 1 ? 's' : ''} with ${totalUpcomingShows} upcoming show${totalUpcomingShows !== 1 ? 's' : ''}`
                  : 'Discover and follow your favorite artists'
                }
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleImportFromSpotify}
                disabled={isImporting}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-sm font-semibold transition-all text-sm sm:text-base",
                  "bg-green-600 hover:bg-green-700 text-white",
                  isImporting && "opacity-50 cursor-not-allowed"
                )}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Sync from Spotify</span>
                  </>
                )}
              </button>
              
              <Link
                href="/explore?tab=artists"
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-white/10 border border-white/20 rounded-sm text-white font-semibold hover:bg-white/20 transition-all text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Discover Artists</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div className="bg-white/5 backdrop-blur-xl rounded-lg border border-white/10 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-white/60">Artists</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {artists.length}
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-xl rounded-lg border border-white/10 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-green-400" />
              <span className="text-sm text-white/60">Upcoming Shows</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {totalUpcomingShows}
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-xl rounded-lg border border-white/10 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-orange-400" />
              <span className="text-sm text-white/60">Hot Artists</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {artists.filter(a => (a.upcoming_shows || 0) > 0).length}
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-xl rounded-lg border border-white/10 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-white/60">Avg Popularity</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {artists.length > 0 ? Math.round(artists.reduce((sum, a) => sum + a.popularity, 0) / artists.length) : 0}
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoadingArtists ? (
          <div className="space-y-8">
            <ArtistsGridSkeleton />
          </div>
        ) : artists.length === 0 ? (
          <EmptyState onImport={handleImportFromSpotify} isImporting={isImporting} />
        ) : (
          <div className="space-y-8 sm:space-y-12">
            {/* Artists Grid */}
            <section>
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                  <Music className="w-6 h-6 text-white/60" />
                  Your Artists
                </h2>
                <Link
                  href="/explore?tab=artists"
                  className="text-white/80 hover:text-white transition-colors flex items-center gap-2 text-sm sm:text-base"
                >
                  Discover more
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6">
                {artists.map((artist) => (
                  <ArtistCard key={artist.id} artist={artist} />
                ))}
              </div>
            </section>

            {/* Upcoming Shows */}
            {upcomingShows && upcomingShows.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                    <Calendar className="w-6 h-6 text-white/60" />
                    Upcoming Shows
                  </h2>
                  <Link
                    href="/explore?tab=upcoming"
                    className="text-white/80 hover:text-white transition-colors flex items-center gap-2 text-sm sm:text-base"
                  >
                    View all shows
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                
                {isLoadingShows ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-64 bg-white/5 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {upcomingShows.slice(0, 8).map((show) => (
                      <ShowCard 
                        key={show.id} 
                        show={{
                          ...show,
                          title: show.title || `${show.artist.name} Live`
                        }} 
                        variant="grid" 
                      />
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <Link
      href={`/artists/${artist.slug}`}
      className="group block"
    >
      <div className="bg-white/5 backdrop-blur-xl rounded-lg border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105 overflow-hidden">
        {/* Artist Image */}
        <div className="aspect-square relative">
          {artist.image_url ? (
            <>
              <img
                src={artist.image_url}
                alt={artist.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
              <Music className="w-8 h-8 sm:w-12 sm:h-12 text-gray-500" />
            </div>
          )}
          
          {/* Upcoming shows badge */}
          {(artist.upcoming_shows || 0) > 0 && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-green-500/80 backdrop-blur-xl rounded-full text-white text-xs font-semibold">
              {artist.upcoming_shows} show{artist.upcoming_shows !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        
        {/* Artist Info */}
        <div className="p-3 sm:p-4">
          <h3 className="font-bold text-sm sm:text-base text-white mb-1 truncate group-hover:text-gray-200 transition-colors">
            {artist.name}
          </h3>
          <p className="text-xs text-white/60 mb-2 truncate">
            {Array.isArray(artist.genres) && artist.genres.length > 0 
              ? artist.genres.slice(0, 2).join(', ')
              : 'Music Artist'
            }
          </p>
          
          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-white/80">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500" />
              <span>{artist.popularity}</span>
            </div>
            {artist.followers && (
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-blue-400" />
                <span>{(artist.followers / 1000000).toFixed(1)}M</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

function EmptyState({ onImport, isImporting }: { onImport: () => void; isImporting: boolean }) {
  return (
    <div className="text-center py-12 sm:py-20">
      <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-white/5 mb-6 sm:mb-8">
        <Music className="w-8 h-8 sm:w-10 sm:h-10 text-white/40" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">No artists yet</h2>
      <p className="text-white/60 mb-8 sm:mb-10 max-w-md mx-auto text-sm sm:text-base px-4">
        Import your top artists from Spotify or discover new ones to start building your personalized music experience.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <button
          onClick={onImport}
          disabled={isImporting}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-sm font-semibold transition-all",
            "bg-green-600 hover:bg-green-700 text-white",
            isImporting && "opacity-50 cursor-not-allowed"
          )}
        >
          {isImporting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Importing from Spotify...
            </>
          ) : (
            <>
              <ExternalLink className="w-5 h-5" />
              Import from Spotify
            </>
          )}
        </button>
        <Link
          href="/explore?tab=artists"
          className="flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 rounded-sm text-white font-semibold hover:bg-white/20 transition-all"
        >
          <Plus className="w-5 h-5" />
          Discover Artists
        </Link>
      </div>
    </div>
  )
}

function ArtistsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="bg-white/5 rounded-lg overflow-hidden">
          <div className="aspect-square bg-white/10 animate-pulse" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-white/10 rounded animate-pulse" />
            <div className="h-3 bg-white/10 rounded animate-pulse w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

function MyArtistsPageSkeleton() {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header Skeleton */}
        <div className="mb-12">
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="h-12 w-64 bg-white/10 rounded-lg mb-4 animate-pulse" />
              <div className="h-6 w-96 bg-white/10 rounded-lg animate-pulse" />
            </div>
            <div className="flex gap-4">
              <div className="h-12 w-32 bg-white/10 rounded-sm animate-pulse" />
              <div className="h-12 w-32 bg-white/10 rounded-sm animate-pulse" />
            </div>
          </div>
        </div>
        
        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
        
        {/* Content Skeleton */}
        <ArtistsGridSkeleton />
      </div>
    </div>
  )
}
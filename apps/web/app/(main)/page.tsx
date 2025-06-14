'use client' // Add this line to make it a client component for data fetching and state

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/lib/graphql-client'
import { SEARCH_ALL } from '@/lib/graphql/queries'
import { supabase } from '@/lib/supabase'
import { ShowCardGrid } from '@/components/shows/ShowCardGrid'
import { FeaturedArtists } from '@/components/artists/FeaturedArtists'
import { TrendingShows } from '@/components/shows/TrendingShows'
import { Search, Music, Users, Calendar } from 'lucide-react'

// Make sure the TrendingShow interface matches the one in TrendingShows.tsx
// Based on previous tool output for TrendingShows.tsx, the interface is:
interface TrendingShow {
  show: {
    id: string;
    date: string;
    title?: string;
    artist: {
      id: string;
      name: string;
      imageUrl?: string;
    };
    venue: {
      id: string;
      name: string;
      city: string;
    };
  };
  totalVotes: number;
  uniqueVoters: number;
  trendingScore: number;
}

interface FeaturedArtist {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  genres?: string[];
  upcomingShowsCount?: number;
}

interface UpcomingShow {
  id: string;
  date: string;
  title?: string;
  artist: {
    id: string;
    name: string;
    imageUrl?: string;
  };
  venue: {
    id: string;
    name: string;
    city: string;
  };
}

interface PopularArtist {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  totalVotes: number;
  upcomingShowsCount: number;
}

export default function HomePage() {
  const [trendingShows, setTrendingShows] = useState<TrendingShow[]>([])
  const [upcomingThisWeek, setUpcomingThisWeek] = useState<UpcomingShow[]>([])
  const [featuredArtists, setFeaturedArtists] = useState<FeaturedArtist[]>([])
  const [popularArtists, setPopularArtists] = useState<PopularArtist[]>([])
  const [isLoadingTrending, setIsLoadingTrending] = useState(true)
  const [isLoadingUpcoming, setIsLoadingUpcoming] = useState(true)
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true)
  const [isLoadingPopular, setIsLoadingPopular] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [importingArtist, setImportingArtist] = useState(false)
  const client = useGraphQLClient()
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Search query
  const { data: searchData, isLoading: isLoadingSearch } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return null
      return client.request(SEARCH_ALL, { query: debouncedQuery })
    },
    enabled: !!debouncedQuery,
  })

  const searchResults = (searchData as any)?.search

  // Handle artist import from search results
  const handleArtistImport = async (artist: any) => {
    if (artist.isFromApi) {
      try {
        setImportingArtist(true)
        const response = await fetch('/api/import-artist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketmasterId: artist.ticketmasterId,
            name: artist.name,
            imageUrl: artist.imageUrl,
            slug: artist.slug
          })
        })
        
        if (!response.ok) {
          throw new Error('Failed to import artist')
        }
        
        const data = await response.json()
        
        // Clear search and navigate
        setSearchQuery('')
        setShowSearchResults(false)
        window.location.href = `/artists/${data.artist.slug}`
      } catch (error) {
        console.error('Error importing artist:', error)
        alert('Failed to import artist. Please try again.')
      } finally {
        setImportingArtist(false)
      }
    } else {
      // Artist already in DB, just navigate
      setSearchQuery('')
      setShowSearchResults(false)
      window.location.href = `/artists/${artist.slug}`
    }
  }

  // Helper function to ensure artist diversity across different show lists
  const ensureArtistDiversity = (shows: any[], usedArtists: Set<string>, maxPerArtist = 1, limit = 10) => {
    const artistCounts = new Map<string, number>()
    const diverseShows = []
    
    // First pass: Add artists not already used elsewhere
    for (const show of shows) {
      const artistId = show.artist_id || show.artist?.id
      if (!usedArtists.has(artistId) && diverseShows.length < limit) {
        diverseShows.push(show)
        artistCounts.set(artistId, 1)
        usedArtists.add(artistId)
      }
    }
    
    // Second pass: Fill remaining spots with artists that haven't hit the limit
    for (const show of shows) {
      const artistId = show.artist_id || show.artist?.id
      const currentCount = artistCounts.get(artistId) || 0
      
      if (currentCount < maxPerArtist && diverseShows.length < limit) {
        if (!diverseShows.find(s => (s.artist_id || s.artist?.id) === artistId && s.id === show.id)) {
          diverseShows.push(show)
          artistCounts.set(artistId, currentCount + 1)
        }
      }
    }
    
    return diverseShows
  }

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoadingTrending(true)
      setIsLoadingUpcoming(true)
      setIsLoadingFeatured(true)
      setIsLoadingPopular(true)
      setError(null)
      
      try {
        const usedArtists = new Set<string>()
        
        // Fetch trending shows (increased limit for better diversity)
        const fetchTrendingShows = async () => {
          try {
            const { data: trendingData, error: trendingError } = await supabase
              .from('trending_shows_view')
              .select('*')
              .eq('status', 'upcoming')
              .gte('date', new Date().toISOString())
              .order('trending_score', { ascending: false })
              .limit(50) // Get more to allow for better artist diversity

            if (trendingError) throw trendingError

            if (!trendingData || trendingData.length === 0) {
              // Fallback to upcoming shows if no trending data
              const { data: fallbackShows, error: fallbackError } = await supabase
                .from('shows')
                .select(`
                  id,
                  date,
                  title,
                  view_count,
                  artist:artists(
                    id,
                    name,
                    image_url
                  ),
                  venue:venues(
                    id,
                    name,
                    city
                  )
                `)
                .eq('status', 'upcoming')
                .gte('date', new Date().toISOString())
                .order('view_count', { ascending: false })
                .limit(30)

              if (fallbackError) throw fallbackError

              const fallbackMapped: TrendingShow[] = (fallbackShows || []).map((show: any) => ({
                show: {
                  id: show.id,
                  date: show.date,
                  title: show.title,
                  artist: {
                    id: show.artist?.id,
                    name: show.artist?.name,
                    imageUrl: show.artist?.image_url,
                  },
                  venue: {
                    id: show.venue?.id,
                    name: show.venue?.name,
                    city: show.venue?.city,
                  },
                },
                totalVotes: 0,
                uniqueVoters: 0,
                trendingScore: show.view_count || 0,
              }))

              const diverseTrending = ensureArtistDiversity(fallbackMapped.map(t => ({ ...t.show, trending_score: t.trendingScore, total_votes: t.totalVotes, unique_voters: t.uniqueVoters })), usedArtists, 2, 12)
              const finalTrending = diverseTrending.map((show: any) => ({
                show: {
                  id: show.id,
                  date: show.date,
                  title: show.title,
                  artist: show.artist,
                  venue: show.venue,
                },
                totalVotes: show.total_votes || 0,
                uniqueVoters: show.unique_voters || 0,
                trendingScore: show.trending_score || 0,
              }))
              
              setTrendingShows(finalTrending)
              return
            }

            // Apply advanced artist diversity (max 2 shows per artist for trending)
            const limitedShows = ensureArtistDiversity(trendingData, usedArtists, 2, 12)

            // Get unique artist and venue IDs to fetch details
            const artistIds = [...new Set(limitedShows.map(show => show.artist_id))]
            const venueIds = [...new Set(limitedShows.map(show => show.venue_id))]

            // Fetch artist and venue details
            const [artistsData, venuesData] = await Promise.all([
              supabase
                .from('artists')
                .select('id, name, image_url')
                .in('id', artistIds),
              supabase
                .from('venues')
                .select('id, name, city')
                .in('id', venueIds)
            ])

            if (artistsData.error) throw artistsData.error
            if (venuesData.error) throw venuesData.error

            // Create maps for quick lookup
            const artistsMap = new Map(artistsData.data?.map(a => [a.id, a]) || [])
            const venuesMap = new Map(venuesData.data?.map(v => [v.id, v]) || [])

            // Transform data to match component interface
            const mappedData: TrendingShow[] = limitedShows.map((trending: any) => {
              const artist = artistsMap.get(trending.artist_id)
              const venue = venuesMap.get(trending.venue_id)
              
              return {
                show: {
                  id: trending.id,
                  date: trending.date,
                  title: trending.title,
                  artist: {
                    id: trending.artist_id,
                    name: artist?.name || 'Unknown Artist',
                    imageUrl: artist?.image_url,
                  },
                  venue: {
                    id: trending.venue_id,
                    name: venue?.name || 'Unknown Venue',
                    city: venue?.city || 'Unknown City',
                  },
                },
                totalVotes: trending.total_votes || 0,
                uniqueVoters: trending.unique_voters || 0,
                trendingScore: trending.trending_score || 0,
              }
            })

            setTrendingShows(mappedData)
          } catch (err: any) {
            console.error('Error fetching trending shows:', err)
          } finally {
            setIsLoadingTrending(false)
          }
        }

        // Fetch upcoming shows this week
        const fetchUpcomingThisWeek = async () => {
          try {
            const nextWeek = new Date()
            nextWeek.setDate(nextWeek.getDate() + 7)
            
            const { data: upcomingData, error: upcomingError } = await supabase
              .from('shows')
              .select(`
                id,
                date,
                title,
                view_count,
                artist:artists(
                  id,
                  name,
                  image_url
                ),
                venue:venues(
                  id,
                  name,
                  city
                )
              `)
              .eq('status', 'upcoming')
              .gte('date', new Date().toISOString())
              .lte('date', nextWeek.toISOString())
              .order('date', { ascending: true })
              .limit(40) // Get more for diversity

            if (upcomingError) throw upcomingError

            // Apply artist diversity (max 1 show per artist for this week)
            const diverseUpcoming = ensureArtistDiversity(
              upcomingData || [], 
              usedArtists, 
              1, 
              8
            ).map((show: any) => ({
              id: show.id,
              date: show.date,
              title: show.title,
              artist: {
                id: show.artist?.id,
                name: show.artist?.name,
                imageUrl: show.artist?.image_url,
              },
              venue: {
                id: show.venue?.id,
                name: show.venue?.name,
                city: show.venue?.city,
              },
            }))

            setUpcomingThisWeek(diverseUpcoming)
          } catch (err: any) {
            console.error('Error fetching upcoming shows:', err)
          } finally {
            setIsLoadingUpcoming(false)
          }
        }

        // Fetch featured artists (avoiding already used artists)
        const fetchFeaturedArtists = async () => {
          try {
            const { data: artistsData, error: artistsError } = await supabase
              .from('artists')
              .select(`
                id,
                name,
                slug,
                image_url,
                genres,
                followers,
                shows!inner(
                  id,
                  status,
                  date
                )
              `)
              .eq('shows.status', 'upcoming')
              .gte('shows.date', new Date().toISOString())
              .order('followers', { ascending: false })
              .limit(20) // Get more for diversity

            if (artistsError) throw artistsError

            // Filter out artists already used in other sections
            const availableArtists = (artistsData || []).filter(artist => 
              !usedArtists.has(artist.id)
            ).slice(0, 6)

            const featuredData: FeaturedArtist[] = availableArtists.map(artist => {
              usedArtists.add(artist.id)
              return {
                id: artist.id,
                name: artist.name,
                slug: artist.slug,
                imageUrl: artist.image_url,
                genres: artist.genres,
                upcomingShowsCount: artist.shows?.length || 0,
              }
            })

            setFeaturedArtists(featuredData)
          } catch (err: any) {
            console.error('Error fetching featured artists:', err)
          } finally {
            setIsLoadingFeatured(false)
          }
        }

        // Fetch popular artists based on voting activity
        const fetchPopularArtists = async () => {
          try {
            // Get artists with most votes in their upcoming shows
            const { data: popularData, error: popularError } = await supabase
              .rpc('get_popular_artists_by_votes', {
                limit_count: 15
              })

            if (popularError) {
              // Fallback to artists with most shows if RPC doesn't exist
              const { data: fallbackData, error: fallbackError } = await supabase
                .from('artists')
                .select(`
                  id,
                  name,
                  slug,
                  image_url,
                  shows!inner(
                    id,
                    status,
                    date
                  )
                `)
                .eq('shows.status', 'upcoming')
                .gte('shows.date', new Date().toISOString())
                .order('created_at', { ascending: false })
                .limit(15)

              if (fallbackError) throw fallbackError

              const fallbackMapped = (fallbackData || []).map(artist => ({
                id: artist.id,
                name: artist.name,
                slug: artist.slug,
                imageUrl: artist.image_url,
                totalVotes: 0,
                upcomingShowsCount: artist.shows?.length || 0,
              }))

              // Filter out already used artists and take first 6
              const availablePopular = fallbackMapped.filter(artist => 
                !usedArtists.has(artist.id)
              ).slice(0, 6)

              setPopularArtists(availablePopular)
            } else {
              // Filter out already used artists
              const availablePopular = (popularData || []).filter((artist: any) => 
                !usedArtists.has(artist.id)
              ).slice(0, 6)

              setPopularArtists(availablePopular)
            }
          } catch (err: any) {
            console.error('Error fetching popular artists:', err)
            setPopularArtists([])
          } finally {
            setIsLoadingPopular(false)
          }
        }

        // Execute all fetches
        await Promise.allSettled([
          fetchTrendingShows(),
          fetchUpcomingThisWeek(),
          fetchFeaturedArtists(),
          fetchPopularArtists()
        ])
        
      } catch (err: any) {
        console.error('Error fetching homepage data:', err)
        setError(err.message || 'Failed to fetch data.')
      }
    }

    fetchAllData()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 px-4 bg-gradient-to-b from-background to-muted/30 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div 
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: 'url(/bg.jpg)' }}
          />
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80"></div>
        </div>
        
        <div className="container mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-headline font-bold mb-6 md:mb-8 text-white leading-tight drop-shadow-lg">
            Vote on the setlists<br />you want to hear.
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8 md:mb-12 max-w-3xl mx-auto font-body leading-relaxed drop-shadow-md">
            Help shape the setlist for upcoming concerts by voting on the songs you want to hear most
          </p>
          
          {/* Search Input */}
          <div ref={searchContainerRef} className="relative max-w-2xl mx-auto mb-8 md:mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Search for artists to add to our platform..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowSearchResults(e.target.value.length > 0)
                }}
                onFocus={() => setShowSearchResults(searchQuery.length > 0)}
                className="w-full pl-12 pr-4 py-4 bg-white/95 backdrop-blur-sm border border-white/20 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:bg-white transition-all text-base shadow-lg"
              />
            </div>
            
            {/* Search Results */}
            {showSearchResults && (searchQuery.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-sm border border-white/20 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
                {isLoadingSearch ? (
                  <div className="p-4">
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                          <div className="w-10 h-10 bg-muted rounded-full" />
                          <div className="flex-1">
                            <div className="h-4 bg-muted rounded mb-1" />
                            <div className="h-3 bg-muted rounded w-2/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : searchResults?.artists?.length > 0 ? (
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                      Artists
                    </div>
                    {searchResults.artists.slice(0, 5).map((artist: any) => (
                      <button
                        key={artist.id || artist.ticketmasterId}
                        onClick={() => handleArtistImport(artist)}
                        disabled={importingArtist}
                        className="w-full flex items-center gap-3 p-3 hover:bg-muted/20 transition-colors text-left disabled:opacity-50"
                      >
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                          {artist.imageUrl ? (
                            <img
                              src={artist.imageUrl}
                              alt={artist.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <Users className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground text-sm truncate">
                            {artist.name}
                            {artist.isFromApi && (
                              <span className="ml-2 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                                New
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {artist.isFromApi ? 'From Ticketmaster API' : `${artist.upcomingShowsCount || 0} upcoming shows`}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : debouncedQuery && !isLoadingSearch ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No artists found for "{debouncedQuery}"</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
          
          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-8 md:mb-12">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-headline font-bold text-white drop-shadow-lg">
                {isLoadingTrending || isLoadingUpcoming ? (
                  <div className="animate-pulse bg-white/20 rounded w-12 h-8 mx-auto" />
                ) : (
                  `${trendingShows.length + upcomingThisWeek.length}+`
                )}
              </div>
              <div className="text-sm text-white/80 font-body drop-shadow-md">Shows Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-headline font-bold text-white drop-shadow-lg">
                {isLoadingFeatured || isLoadingPopular ? (
                  <div className="animate-pulse bg-white/20 rounded w-12 h-8 mx-auto" />
                ) : (
                  `${featuredArtists.length + popularArtists.length}+`
                )}
              </div>
              <div className="text-sm text-white/80 font-body drop-shadow-md">Artists Featured</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-headline font-bold text-white drop-shadow-lg">
                {isLoadingTrending ? (
                  <div className="animate-pulse bg-white/20 rounded w-16 h-8 mx-auto" />
                ) : (
                  `${trendingShows.reduce((sum, show) => sum + show.totalVotes, 0)}+`
                )}
              </div>
              <div className="text-sm text-white/80 font-body drop-shadow-md">Votes Cast</div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center">
            <Link
              href="/shows"
              className="btn-primary text-base md:text-lg px-8 md:px-10 shadow-lg hover:shadow-xl transition-shadow inline-flex items-center justify-center"
            >
              Discover Shows
            </Link>
            <Link
              href="/artists"
              className="btn-secondary text-base md:text-lg px-8 md:px-10 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 shadow-lg hover:shadow-xl transition-all inline-flex items-center justify-center"
            >
              Find Artists
            </Link>
          </div>
        </div>
      </section>

      {/* Trending Shows Section */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-headline font-bold mb-2 md:mb-4 gradient-text">Trending Shows</h2>
              <p className="text-muted-foreground text-base md:text-lg font-body">
                The hottest shows based on voting activity and engagement
              </p>
            </div>
            <Link
              href="/shows"
              className="text-primary font-headline font-semibold hover:gradient-text transition-all duration-300 whitespace-nowrap"
            >
              View all →
            </Link>
          </div>
          
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-8">
              <p className="text-destructive text-center font-body">{error}</p>
            </div>
          )}
          <ShowCardGrid shows={trendingShows} isLoading={isLoadingTrending} />
        </div>
      </section>

      {/* Upcoming This Week Section */}
      <section className="py-16 md:py-20 bg-muted/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-headline font-bold mb-2 md:mb-4 gradient-text">Upcoming This Week</h2>
              <p className="text-muted-foreground text-base md:text-lg font-body">
                Don't miss these shows happening in the next 7 days
              </p>
            </div>
            <Link
              href="/shows?filter=this-week"
              className="text-primary font-headline font-semibold hover:gradient-text transition-all duration-300 whitespace-nowrap"
            >
              View all →
            </Link>
          </div>
          
          <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {isLoadingUpcoming ? (
              [...Array(8)].map((_, i) => (
                <div key={i} className="card-base h-80 animate-pulse">
                  <div className="aspect-[4/3] bg-muted/50 animate-pulse rounded-t-lg" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-muted/50 rounded animate-pulse" />
                    <div className="h-4 bg-muted/30 rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-muted/30 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))
            ) : upcomingThisWeek.length > 0 ? (
              upcomingThisWeek.map((show) => (
                <Link
                  key={show.id}
                  href={`/shows/${show.id}`}
                  className="card-base overflow-hidden group hover:shadow-lg transition-all duration-300"
                >
                  <div className="aspect-[4/3] relative bg-muted overflow-hidden">
                    {show.artist.imageUrl ? (
                      <img
                        src={show.artist.imageUrl}
                        alt={show.artist.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center">
                        <span className="text-2xl font-headline font-bold text-muted-foreground/50">
                          {show.artist.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-40" />
                    
                    {/* Days until show badge */}
                    <div className="absolute top-3 right-3 bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-bold">
                      {Math.ceil((new Date(show.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}d
                    </div>
                    
                    {/* Genre badge if available */}
                    <div className="absolute top-3 left-3 bg-primary/80 text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                      Live
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-lg font-headline font-bold mb-2 text-foreground group-hover:gradient-text transition-all duration-300 line-clamp-1">
                      {show.artist.name}
                    </h3>
                    {show.title && (
                      <h4 className="text-sm font-headline font-medium mb-3 text-muted-foreground line-clamp-1">
                        {show.title}
                      </h4>
                    )}
                    <div className="space-y-2 text-sm text-muted-foreground font-body mb-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium line-clamp-1">{show.venue.name}</span>
                      </div>
                      <div className="text-muted-foreground/70 font-medium line-clamp-1">
                        {show.venue.city}
                      </div>
                      <div className="text-accent font-semibold">
                        {new Date(show.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                    <div className="pt-3 border-t border-border/30">
                      <span className="text-sm font-headline font-semibold text-primary group-hover:gradient-text transition-all duration-300">
                        Vote Now →
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-20">
                <p className="text-muted-foreground text-xl font-body">No shows coming up this week.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Popular Artists Section */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-headline font-bold mb-2 md:mb-4 gradient-text">Popular Artists</h2>
              <p className="text-muted-foreground text-base md:text-lg font-body">
                Artists getting the most votes from fans
              </p>
            </div>
            <Link
              href="/artists"
              className="text-primary font-headline font-semibold hover:gradient-text transition-all duration-300 whitespace-nowrap"
            >
              View all →
            </Link>
          </div>
          
          <div className="grid gap-4 md:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {isLoadingPopular ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="card-base h-64 animate-pulse">
                  <div className="aspect-square bg-muted/50 animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-muted/50 rounded animate-pulse" />
                    <div className="h-3 bg-muted/30 rounded animate-pulse w-2/3" />
                  </div>
                </div>
              ))
            ) : popularArtists.length > 0 ? (
              popularArtists.map((artist) => (
                <Link
                  key={artist.id}
                  href={`/artists/${artist.slug}`}
                  className="card-base overflow-hidden group text-center"
                >
                  <div className="aspect-square relative bg-muted overflow-hidden">
                    {artist.imageUrl ? (
                      <img
                        src={artist.imageUrl}
                        alt={artist.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center">
                        <span className="text-3xl font-headline font-bold text-muted-foreground/50">
                          {artist.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-80" />
                    
                    {/* Vote count badge */}
                    {artist.totalVotes > 0 && (
                      <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-bold">
                        {artist.totalVotes} votes
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-sm font-headline font-bold mb-2 text-foreground group-hover:gradient-text transition-all duration-300 line-clamp-2">
                      {artist.name}
                    </h3>
                    <div className="text-xs text-muted-foreground font-body">
                      {artist.upcomingShowsCount} {artist.upcomingShowsCount === 1 ? 'show' : 'shows'}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-20">
                <p className="text-muted-foreground text-xl font-body">No popular artists at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Artists Section */}
      <section className="py-16 md:py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-headline font-bold mb-2 md:mb-4 gradient-text">Featured Artists</h2>
              <p className="text-muted-foreground text-base md:text-lg font-body">
                Top artists with upcoming shows to vote on
              </p>
            </div>
            <Link
              href="/artists"
              className="text-primary font-headline font-semibold hover:gradient-text transition-all duration-300 whitespace-nowrap"
            >
              View all →
            </Link>
          </div>
          
          <FeaturedArtists artists={featuredArtists} isLoading={isLoadingFeatured} />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gradient-to-b from-background to-muted/10">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-headline font-bold text-center mb-16 text-foreground">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center group">
              <div className="w-20 h-20 glass mx-auto mb-6 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <span className="text-2xl font-headline font-bold gradient-text">1</span>
              </div>
              <h3 className="text-2xl font-headline font-semibold mb-4 text-foreground">Find a Show</h3>
              <p className="text-muted-foreground font-body leading-relaxed">
                Search for upcoming concerts from your favorite artists
              </p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 glass mx-auto mb-6 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <span className="text-2xl font-headline font-bold gradient-text">2</span>
              </div>
              <h3 className="text-2xl font-headline font-semibold mb-4 text-foreground">Vote for Songs</h3>
              <p className="text-muted-foreground font-body leading-relaxed">
                Cast your votes for the songs you want to hear live
              </p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 glass mx-auto mb-6 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <span className="text-2xl font-headline font-bold gradient-text">3</span>
              </div>
              <h3 className="text-2xl font-headline font-semibold mb-4 text-foreground">See Results</h3>
              <p className="text-muted-foreground font-body leading-relaxed">
                Watch in real-time as votes come in and influence the setlist
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-muted/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to influence your favorite concerts?
          </h2>
          <p className="text-xl mb-8 text-muted-foreground max-w-2xl mx-auto">
            Join thousands of fans voting on setlists for upcoming shows
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="btn-primary px-8 py-3"
            >
              Get Started Free
            </Link>
            <Link
              href="/shows"
              className="btn-secondary px-8 py-3"
            >
              Browse Shows
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
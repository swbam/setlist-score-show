'use client' // Add this line to make it a client component for data fetching and state

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/lib/graphql-client'
import { SEARCH_ALL, GET_TRENDING_SHOWS } from '@/lib/graphql/queries'
import { supabase } from '@/lib/supabase'
import { ShowCard } from '@/components/shows/ShowCard'
import { Search, TrendingUp, Calendar, Users, ArrowRight } from 'lucide-react'

interface SearchResult {
  artists: any[]
  venues: any[]
  shows: any[]
}

export default function HomePage() {
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
    return () => document.removeEventListener('mousedown', handleClickOutside)
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

  // Trending shows
  const { data: trendingData, isLoading: loadingTrending } = useQuery({
    queryKey: ['homepage-trending'],
    queryFn: async () => {
      return client.request(GET_TRENDING_SHOWS, { limit: 8 })
    }
  })

  // Top upcoming shows (auto-imported from Ticketmaster)
  const { data: upcomingShows, isLoading: loadingUpcoming } = useQuery({
    queryKey: ['homepage-top-shows'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shows')
        .select(`
          id,
          date,
          title,
          status,
          view_count,
          popularity,
          artists(id, name, slug, image_url),
          venues(id, name, city, state, country)
        `)
        .eq('status', 'upcoming')
        .gte('date', new Date().toISOString())
        .order('popularity', { ascending: false })
        .order('date', { ascending: true })
        .limit(8)

      if (error) throw error

      return data?.map((show: any) => ({
        id: show.id,
        date: show.date,
        title: show.title || `${show.artists?.name} at ${show.venues?.name}`,
        status: show.status,
        viewCount: show.view_count || 0,
        popularity: show.popularity || 0,
        artist: {
          id: show.artists?.id,
          name: show.artists?.name || 'Unknown Artist',
          slug: show.artists?.slug || '',
          imageUrl: show.artists?.image_url
        },
        venue: {
          id: show.venues?.id,
          name: show.venues?.name || 'Unknown Venue',
          city: show.venues?.city || 'Unknown City',
          state: show.venues?.state,
          country: show.venues?.country || 'Unknown Country'
        }
      })) || []
    }
  })

  const searchResults = (searchData as any)?.search as SearchResult

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
        
        if (!response.ok) throw new Error('Failed to import artist')
        
        const data = await response.json()
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
      setSearchQuery('')
      setShowSearchResults(false)
      window.location.href = `/artists/${artist.slug}`
    }
  }

  const trendingShows = (trendingData as any)?.trendingShows || []

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Search */}
      <div className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="absolute inset-0 bg-[url('/bg.jpg')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/60 to-black/80" />
        
        <div className="relative w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-headline font-bold mb-4 text-white drop-shadow-lg">
              Vote on Your Favorite
              <span className="block gradient-text">Concert Setlists</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow">
              Help shape the perfect show by voting on songs you want to hear live
            </p>
          </div>

          {/* Search Bar */}
          <div ref={searchContainerRef} className="relative max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
              <input
                type="text"
                placeholder="Search for artists, venues, or cities..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowSearchResults(true)
                }}
                onFocus={() => setShowSearchResults(true)}
                className="w-full pl-12 pr-4 py-4 text-lg bg-black/40 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
              />
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && debouncedQuery && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-black/90 backdrop-blur-sm border border-white/20 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
                {isLoadingSearch ? (
                  <div className="p-4 text-center text-white/60">Searching...</div>
                ) : searchResults ? (
                  <div className="p-2">
                    {/* Artists */}
                    {searchResults.artists?.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold text-white/80 px-3 py-2">Artists</h3>
                        {searchResults.artists.slice(0, 3).map((artist: any) => (
                          <button
                            key={artist.id || artist.ticketmasterId}
                            onClick={() => handleArtistImport(artist)}
                            disabled={importingArtist}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-left"
                          >
                            {artist.imageUrl && (
                              <img src={artist.imageUrl} alt={artist.name} className="w-10 h-10 rounded-full object-cover" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-white truncate">{artist.name}</div>
                              <div className="text-sm text-white/60">
                                {artist.isFromApi ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                                    New
                                  </span>
                                ) : (
                                  'Artist'
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Shows */}
                    {searchResults.shows?.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold text-white/80 px-3 py-2">Shows</h3>
                        {searchResults.shows.slice(0, 3).map((show: any) => (
                          <Link
                            key={show.id}
                            href={`/shows/${show.id}`}
                            className="block p-3 rounded-lg hover:bg-white/10 transition-colors"
                            onClick={() => setShowSearchResults(false)}
                          >
                            <div className="font-medium text-white truncate">{show.artist?.name}</div>
                            <div className="text-sm text-white/60 truncate">
                              {show.venue?.name}, {show.venue?.city}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Venues */}
                    {searchResults.venues?.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-white/80 px-3 py-2">Venues</h3>
                        {searchResults.venues.slice(0, 3).map((venue: any) => (
                          <div key={venue.id} className="p-3 rounded-lg hover:bg-white/10 transition-colors">
                            <div className="font-medium text-white truncate">{venue.name}</div>
                            <div className="text-sm text-white/60 truncate">{venue.city}, {venue.state}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 text-center text-white/60">No results found</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-8 sm:py-12 lg:py-16">
        
        {/* Trending Shows Section */}
        <section className="mb-12 lg:mb-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h2 className="text-2xl sm:text-3xl font-headline font-bold gradient-text">
                Trending This Week
              </h2>
            </div>
            <Link 
              href="/explore"
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {loadingTrending ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-muted rounded-xl h-64" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {trendingShows.slice(0, 8).map((show: any) => (
                <ShowCard
                  key={show.id}
                  show={{
                    id: show.id,
                    date: show.date,
                    title: show.title || `${show.artist?.name} at ${show.venue?.name}`,
                    status: 'upcoming',
                    viewCount: show.viewCount || 0,
                    trendingScore: show.trendingScore,
                    artist: {
                      id: show.artist?.id,
                      name: show.artist?.name || 'Unknown Artist',
                      slug: show.artist?.slug || '',
                      imageUrl: show.artist?.imageUrl
                    },
                    venue: {
                      id: show.venue?.id,
                      name: show.venue?.name || 'Unknown Venue',
                      city: show.venue?.city || 'Unknown City',
                      state: show.venue?.state,
                      country: show.venue?.country || 'Unknown Country'
                    }
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Shows Section */}
        <section className="mb-12 lg:mb-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-primary" />
              <h2 className="text-2xl sm:text-3xl font-headline font-bold gradient-text">
                Top Shows
              </h2>
            </div>
            <Link 
              href="/explore"
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {loadingUpcoming ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-muted rounded-xl h-64" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {upcomingShows?.slice(0, 8).map((show: any) => (
                <ShowCard key={show.id} show={show} />
              ))}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-headline font-bold gradient-text mb-6">
            Explore More
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Link
              href="/explore"
              className="group p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 transition-all duration-200 hover:shadow-lg"
            >
              <TrendingUp className="w-8 h-8 text-primary mb-3" />
              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                Trending Shows
              </h3>
              <p className="text-muted-foreground text-sm">
                Discover the hottest shows based on fan engagement
              </p>
            </Link>

            <Link
              href="/explore"
              className="group p-6 rounded-xl bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20 hover:border-secondary/40 transition-all duration-200 hover:shadow-lg"
            >
              <Calendar className="w-8 h-8 text-secondary mb-3" />
              <h3 className="text-lg font-semibold mb-2 group-hover:text-secondary transition-colors">
                Upcoming Concerts
              </h3>
              <p className="text-muted-foreground text-sm">
                Browse all upcoming shows and start voting
              </p>
            </Link>

            <Link
              href="/explore"
              className="group p-6 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 hover:border-accent/40 transition-all duration-200 hover:shadow-lg"
            >
              <Users className="w-8 h-8 text-accent mb-3" />
              <h3 className="text-lg font-semibold mb-2 group-hover:text-accent transition-colors">
                All Artists
              </h3>
              <p className="text-muted-foreground text-sm">
                Explore artists and follow your favorites
              </p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
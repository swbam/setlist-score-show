'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Search, TrendingUp, Calendar, Users, ArrowRight, Music, Play } from 'lucide-react'
import { ShowCard } from '@/components/shows/ShowCard'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'

interface SearchResult {
  artists: any[]
  venues: any[]
  shows: any[]
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null)
  const [isLoadingSearch, setIsLoadingSearch] = useState(false)
  const [importingArtist, setImportingArtist] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Handle click outside to close search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search functionality
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults(null)
      return
    }

    const searchData = async () => {
      setIsLoadingSearch(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
        if (response.ok) {
          const data = await response.json()
          setSearchResults(data)
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsLoadingSearch(false)
      }
    }

    searchData()
  }, [debouncedQuery])

  // Fetch trending shows
  const { data: trendingShows, isLoading: loadingTrending } = useQuery({
    queryKey: ['trending-shows'],
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
          )
        `)
        .eq('status', 'upcoming')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('popularity', { ascending: false })
        .order('date', { ascending: true })
        .limit(6)

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
    },
    staleTime: 5 * 60 * 1000,
  })

  // Fetch featured artists
  const { data: featuredArtists, isLoading: loadingArtists } = useQuery({
    queryKey: ['featured-artists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artists')
        .select(`
          id,
          name,
          slug,
          image_url,
          genre
        `)
        .order('name')
        .limit(8)

      if (error) throw error
      return data || []
    },
    staleTime: 10 * 60 * 1000,
  })

  const handleArtistImport = async (artist: any) => {
    if (importingArtist) return
    
    setImportingArtist(true)
    try {
      const response = await fetch('/api/import-artist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketmasterId: artist.ticketmasterId,
          name: artist.name,
          imageUrl: artist.imageUrl
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.artist?.slug) {
          window.location.href = `/artists/${result.artist.slug}`
        }
      }
    } catch (error) {
      console.error('Import error:', error)
    } finally {
      setImportingArtist(false)
    }
  }

  const genres = [
    { name: 'Rock/Alternative', id: 'rock' },
    { name: 'Pop', id: 'pop' },
    { name: 'Hip-Hop/Rap', id: 'hip-hop' },
    { name: 'Country', id: 'country' },
    { name: 'Electronic/Dance', id: 'electronic' },
    { name: 'R&B/Soul', id: 'rnb' },
    { name: 'Latin', id: 'latin' },
    { name: 'Jazz/Blues', id: 'jazz' }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="absolute inset-0 bg-[url('/bg.jpg')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/60 to-black/80" />
        
        <div className="relative w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-8 sm:py-10 lg:py-12">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-headline font-bold mb-3 text-white drop-shadow-lg">
              Crowdsourced Concert Setlists
              <span className="block gradient-text">by Real Fans</span>
            </h1>
            <p className="text-base sm:text-lg text-white/90 mb-6 max-w-xl mx-auto drop-shadow">
              Vote on songs, shape the show, and see what thousands of fans want to hear live
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <Link
                href="/explore?tab=upcoming"
                className="btn-primary px-6 py-3 text-base font-semibold"
              >
                Browse Upcoming Shows
              </Link>
              <button className="px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all font-semibold">
                How It Works
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div ref={searchContainerRef} className="relative max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
              <input
                type="text"
                placeholder="Search for artists, venues, or cities..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowSearchResults(true)
                }}
                onFocus={() => setShowSearchResults(true)}
                className="w-full pl-10 pr-4 py-3 text-base bg-black/40 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
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
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-8 lg:py-10">
        
        {/* Trending This Week Section */}
        <section className="mb-8 lg:mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-xl sm:text-2xl font-headline font-bold gradient-text">
                Trending This Week
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              The hottest shows fans are voting on right now
            </p>
          </div>
          
          {loadingTrending ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-muted rounded-xl h-48" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {trendingShows?.slice(0, 6).map((show: any) => (
                <ShowCard key={show.id} show={show} />
              ))}
            </div>
          )}
        </section>

        {/* Featured Artists Section */}
        <section className="mb-8 lg:mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-xl sm:text-2xl font-headline font-bold gradient-text">
                Featured Artists
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Top artists with the most active setlist communities
            </p>
          </div>
          
          {loadingArtists ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-muted rounded-xl h-32" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {featuredArtists?.slice(0, 8).map((artist: any) => (
                <Link
                  key={artist.id}
                  href={`/artists/${artist.slug}`}
                  className="group block p-3 rounded-xl bg-card hover:bg-card/80 transition-all duration-200 border border-border/50 hover:border-border hover:shadow-lg"
                >
                  <div className="flex flex-col items-center text-center">
                    {artist.image_url ? (
                      <img
                        src={artist.image_url}
                        alt={artist.name}
                        className="w-16 h-16 rounded-full object-cover border border-border/50 mb-2"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-2">
                        <Music className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate w-full">
                      {artist.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      {artist.genre || 'Music'}
                    </p>
                    <button className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg hover:bg-primary/20 transition-colors">
                      Vote Now
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Tours Section */}
        <section className="mb-8 lg:mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="text-xl sm:text-2xl font-headline font-bold gradient-text">
                Upcoming Tours
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Major tours hitting the road - help build their setlists
            </p>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-64 p-4 rounded-xl bg-card border border-border/50 hover:border-border hover:shadow-lg transition-all duration-200"
              >
                <div className="w-full h-32 bg-muted rounded-lg mb-3 flex items-center justify-center">
                  <Play className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Tour Name</h3>
                <p className="text-xs text-muted-foreground mb-2">2024 World Tour</p>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>25 shows</span>
                  <span>15 cities</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Genre-Based Discovery */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl sm:text-2xl font-headline font-bold gradient-text mb-2">
              Find Shows by Genre
            </h2>
            <p className="text-sm text-muted-foreground">
              Find shows by your favorite music style
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {genres.map((genre) => (
              <Link
                key={genre.id}
                href={`/search?genre=${genre.id}`}
                className="group p-4 rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-border/50 hover:border-border hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <Music className="w-5 h-5 text-primary" />
                  <span className="font-medium text-sm group-hover:text-primary transition-colors">
                    {genre.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
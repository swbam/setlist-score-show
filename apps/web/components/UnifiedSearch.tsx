'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, MapPin, Music, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

interface SearchResult {
  artists: Array<{
    id: string
    name: string
    slug: string
    imageUrl: string | null
    popularity: number
  }>
  venues: Array<{
    id: string
    name: string
    city: string
    state: string | null
    country: string
  }>
  nearbyShows?: Array<{
    show_id: string
    show_name: string
    show_date: string
    artist_name: string
    artist_slug: string
    artist_image: string | null
    venue_name: string
    venue_city: string
    venue_state: string
    distance_km: number
    total_votes: number
  }>
  zipInfo?: {
    city: string
    state: string
  } | null
}

export function UnifiedSearch() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [results, setResults] = useState<SearchResult>({ artists: [], venues: [], nearbyShows: [], zipInfo: null })
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search function
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults({ artists: [], venues: [], nearbyShows: [], zipInfo: null })
      return
    }

    const performSearch = async () => {
      setIsLoading(true)
      try {
        // Check if query looks like a zip code (5 digits)
        const isZipCode = /^\d{5}$/.test(debouncedQuery.trim())
        
        if (isZipCode) {
          // Use the get_nearby_shows RPC function for ZIP code searches
          const [nearbyShows, zipInfo] = await Promise.all([
            supabase.rpc('get_nearby_shows', {
              p_zip_code: debouncedQuery,
              p_radius_km: 80 // ~50 miles
            }),
            supabase
              .from('zip_codes')
              .select('city, state')
              .eq('zip_code', debouncedQuery)
              .single()
          ])

          setResults({
            artists: [],
            venues: [],
            nearbyShows: nearbyShows.data || [],
            zipInfo: zipInfo.data || null
          })
        } else {
          // Search artists by name
          const { data: artistData } = await supabase
            .from('artists')
            .select('id, name, slug, image_url, popularity')
            .ilike('name', `%${debouncedQuery}%`)
            .gte('popularity', 20)
            .order('popularity', { ascending: false })
            .limit(8)

          setResults({
            artists: artistData?.map(artist => ({
              id: artist.id,
              name: artist.name,
              slug: artist.slug,
              imageUrl: artist.image_url,
              popularity: artist.popularity
            })) || [],
            venues: [],
            nearbyShows: [],
            zipInfo: null
          })
        }
      } catch (error) {
        console.error('Search error:', error)
        setResults({ artists: [], venues: [], nearbyShows: [], zipInfo: null })
      } finally {
        setIsLoading(false)
      }
    }

    performSearch()
  }, [debouncedQuery])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setShowResults(true)
  }

  const clearSearch = () => {
    setQuery('')
    setShowResults(false)
    setResults({ artists: [], venues: [], nearbyShows: [], zipInfo: null })
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
        <input
          type="text"
          placeholder="Search artists or enter zip code..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => setShowResults(true)}
          className="w-full pl-12 pr-4 py-4 text-lg bg-black/40 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
        />
        {isLoading && (
          <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60 animate-spin" />
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && debouncedQuery && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-black/90 backdrop-blur-sm border border-white/20 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-white/60">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              Searching...
            </div>
          ) : (
            <div className="p-2">
              {/* Artists Results */}
              {results.artists.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-white/80 px-3 py-2 flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    Artists
                  </h3>
                  {results.artists.map((artist) => (
                    <Link
                      key={artist.id}
                      href={`/artists/${artist.slug}`}
                      onClick={clearSearch}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      {artist.imageUrl ? (
                        <Image
                          src={artist.imageUrl}
                          alt={artist.name}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Music className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">{artist.name}</div>
                        <div className="text-sm text-white/60">
                          Popularity: {artist.popularity}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Nearby Shows Results (for ZIP code searches) */}
              {results.nearbyShows && results.nearbyShows.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white/80 px-3 py-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Shows Near {results.zipInfo?.city}, {results.zipInfo?.state}
                  </h3>
                  <div className="max-h-80 overflow-y-auto">
                    {results.nearbyShows.slice(0, 8).map((show) => (
                      <Link
                        key={show.show_id}
                        href={`/shows/${show.show_id}`}
                        onClick={clearSearch}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors group"
                      >
                        {show.artist_image ? (
                          <img
                            src={show.artist_image}
                            alt={show.artist_name}
                            className="w-10 h-10 rounded-lg object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Music className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate group-hover:text-purple-200 transition-colors">
                            {show.artist_name}
                          </div>
                          <div className="text-sm text-white/60 truncate">
                            {show.venue_name}, {show.venue_city}
                          </div>
                          <div className="text-xs text-white/50 flex items-center gap-2 mt-1">
                            <span>{new Date(show.show_date).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{Math.round(show.distance_km * 0.621371)} mi away</span>
                            {show.total_votes > 0 && (
                              <>
                                <span>•</span>
                                <span>{show.total_votes} votes</span>
                              </>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                    
                    {results.nearbyShows.length > 8 && (
                      <Link
                        href={`/nearby/${debouncedQuery}`}
                        onClick={clearSearch}
                        className="block p-3 text-center text-white/80 hover:text-white hover:bg-white/5 transition-colors rounded-lg border border-white/10 mx-3 mt-2"
                      >
                        View all {results.nearbyShows.length} shows →
                      </Link>
                    )}
                  </div>
                </div>
              )}
              
              {/* ZIP code with no shows */}
              {results.zipInfo && (!results.nearbyShows || results.nearbyShows.length === 0) && (
                <div className="p-4 text-center text-white/60">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <div className="mb-2">No upcoming shows found near</div>
                  <div className="text-white/80 font-medium">
                    {results.zipInfo.city}, {results.zipInfo.state}
                  </div>
                  <div className="text-sm text-white/40 mt-2">
                    Try searching for artists or a different area
                  </div>
                </div>
              )}

              {/* No Results */}
              {results.artists.length === 0 && 
               results.venues.length === 0 && 
               (!results.nearbyShows || results.nearbyShows.length === 0) && 
               !results.zipInfo && 
               !isLoading && (
                <div className="p-4 text-center text-white/60">
                  <div className="mb-2">No results found</div>
                  <div className="text-sm text-white/40">
                    Try searching for an artist name or 5-digit ZIP code
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

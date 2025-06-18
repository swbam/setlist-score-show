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
}

export function UnifiedSearch() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [results, setResults] = useState<SearchResult>({ artists: [], venues: [] })
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
      setResults({ artists: [], venues: [] })
      return
    }

    const performSearch = async () => {
      setIsLoading(true)
      try {
        // Check if query looks like a zip code (5 digits)
        const isZipCode = /^\d{5}$/.test(debouncedQuery.trim())
        
        if (isZipCode) {
          // Search venues by zip code area
          const { data: venueData } = await supabase
            .from('venues')
            .select('id, name, city, state, country, postal_code')
            .or(`postal_code.ilike.%${debouncedQuery}%,city.ilike.%${debouncedQuery}%`)
            .eq('country', 'United States')
            .limit(10)

          setResults({
            artists: [],
            venues: venueData || []
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
            venues: []
          })
        }
      } catch (error) {
        console.error('Search error:', error)
        setResults({ artists: [], venues: [] })
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
    setResults({ artists: [], venues: [] })
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

              {/* Venues Results (for zip code searches) */}
              {results.venues.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white/80 px-3 py-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Venues in Area
                  </h3>
                  {results.venues.map((venue) => (
                    <div
                      key={venue.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={() => {
                        // Navigate to shows in this city
                        window.location.href = `/explore?city=${encodeURIComponent(venue.city)}&state=${encodeURIComponent(venue.state || '')}`
                        clearSearch()
                      }}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">{venue.name}</div>
                        <div className="text-sm text-white/60 truncate">
                          {venue.city}, {venue.state}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No Results */}
              {results.artists.length === 0 && results.venues.length === 0 && !isLoading && (
                <div className="p-4 text-center text-white/60">
                  <div className="mb-2">No results found</div>
                  <div className="text-sm text-white/40">
                    Try searching for an artist name or 5-digit zip code
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

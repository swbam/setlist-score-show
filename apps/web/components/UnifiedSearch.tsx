'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, MapPin, Music, Loader2, ExternalLink, Plus } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface LocalSearchResult {
  artists: Array<{
    id: string
    name: string
    slug: string
    imageUrl: string | null
    popularity: number
    source: 'local'
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

interface ExternalSearchResult {
  artists: Array<{
    id: string
    name: string
    popularity: number
    followers: number
    genres: string[]
    image_url: string | null
    spotify_url: string
    source: 'spotify'
    can_import: boolean
  }>
  shows: Array<{
    id: string
    name: string
    artist_name: string
    artist_image: string | null
    venue_name: string
    venue_city: string
    venue_state: string
    date: string
    status: string
    ticket_url: string
    min_price?: number
    max_price?: number
    source: 'ticketmaster'
    can_import: boolean
  }>
}

export function UnifiedSearch() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [localResults, setLocalResults] = useState<LocalSearchResult>({ artists: [], nearbyShows: [], zipInfo: null })
  const [externalResults, setExternalResults] = useState<ExternalSearchResult>({ artists: [], shows: [] })
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [isImporting, setIsImporting] = useState<string | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

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
      setLocalResults({ artists: [], nearbyShows: [], zipInfo: null })
      setExternalResults({ artists: [], shows: [] })
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

          setLocalResults({
            artists: [],
            nearbyShows: nearbyShows.data || [],
            zipInfo: zipInfo.data || null
          })
          setExternalResults({ artists: [], shows: [] })
        } else {
          // Step 1: Search external APIs first (prioritized as per MASTER-FIX-PLUS.md)
          let externalSearch = null
          try {
            const response = await fetch(`/api/search/external?q=${encodeURIComponent(debouncedQuery)}`)
            if (response.ok) {
              externalSearch = await response.json()
            }
          } catch (error) {
            console.error('External search failed:', error)
          }

          const externalArtists = externalSearch?.results?.artists || []
          const externalShows = externalSearch?.results?.shows || []

          // Step 2: If external results are insufficient (< 5 total), supplement with local
          let localArtists: any[] = []
          const totalExternalResults = externalArtists.length + externalShows.length
          
          if (totalExternalResults < 5) {
            const localSearch = await supabase
              .from('artists')
              .select('id, name, slug, image_url, popularity')
              .ilike('name', `%${debouncedQuery}%`)
              .gte('popularity', 20)
              .order('popularity', { ascending: false })
              .limit(8 - totalExternalResults) // Fill remaining slots

            localArtists = localSearch.data?.map(artist => ({
              id: artist.id,
              name: artist.name,
              slug: artist.slug,
              imageUrl: artist.image_url,
              popularity: artist.popularity,
              source: 'local' as const
            })) || []
          }

          // Set results with external prioritized
          setLocalResults({
            artists: localArtists,
            nearbyShows: [],
            zipInfo: null
          })

          setExternalResults({
            artists: externalArtists,
            shows: externalShows
          })
        }
      } catch (error) {
        console.error('Search error:', error)
        setLocalResults({ artists: [], nearbyShows: [], zipInfo: null })
        setExternalResults({ artists: [], shows: [] })
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
    setLocalResults({ artists: [], nearbyShows: [], zipInfo: null })
    setExternalResults({ artists: [], shows: [] })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowResults(false)
    }
    // TODO: Add arrow key navigation for results
  }

  const handleImport = async (type: 'artist' | 'show', data: any) => {
    setIsImporting(data.id)
    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...data })
      })

      const result = await response.json()
      
      if (result.success) {
        if (type === 'artist') {
          // Navigate to artist page
          router.push(`/artists/${result.slug}`)
        } else if (type === 'show') {
          // Navigate to show page
          router.push(`/shows/${result.show_id}`)
        }
        clearSearch()
      } else {
        console.error('Import failed:', result.error)
      }
    } catch (error) {
      console.error('Import error:', error)
    } finally {
      setIsImporting(null)
    }
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
          onKeyDown={handleKeyDown}
          onFocus={() => setShowResults(true)}
          className="w-full pl-12 pr-4 py-4 text-lg bg-black/40 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all"
        />
        {isLoading && (
          <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60 animate-spin" />
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && debouncedQuery && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-black/90 backdrop-blur-sm border border-white/20 rounded-xl shadow-2xl z-50 max-h-[500px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-white/60">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              Searching Ticketmaster and Spotify...
            </div>
          ) : (
            <div className="p-2">
              {/* External Artists from Spotify - PRIORITIZED FIRST */}
              {externalResults.artists.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-white/80 px-3 py-2 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Artists from Spotify
                  </h3>
                  {externalResults.artists.map((artist) => (
                    <div
                      key={artist.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      {artist.image_url ? (
                        <Image
                          src={artist.image_url}
                          alt={artist.name}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                          <Music className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">{artist.name}</div>
                        <div className="text-sm text-white/60">
                          {artist.followers?.toLocaleString()} followers • {artist.genres.slice(0, 2).join(', ')}
                        </div>
                      </div>
                      <button
                        onClick={() => handleImport('artist', artist)}
                        disabled={isImporting === artist.id}
                        className="flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors disabled:opacity-50"
                      >
                        {isImporting === artist.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Local Artists - SHOWN SECOND */}
              {localResults.artists.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-white/80 px-3 py-2 flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    Artists in Database
                  </h3>
                  {localResults.artists.map((artist) => (
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
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
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

              {/* External Shows from Ticketmaster */}
              {externalResults.shows.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-white/80 px-3 py-2 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Shows from Ticketmaster
                  </h3>
                  {externalResults.shows.slice(0, 6).map((show) => (
                    <div
                      key={show.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      {show.artist_image ? (
                        <Image
                          src={show.artist_image}
                          alt={show.artist_name}
                          width={40}
                          height={40}
                          className="rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                          <Music className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">{show.artist_name}</div>
                        <div className="text-sm text-white/60 truncate">
                          {show.venue_name}, {show.venue_city}
                        </div>
                        <div className="text-xs text-white/50 flex items-center gap-2 mt-1">
                          <span>{new Date(show.date).toLocaleDateString()}</span>
                          {show.min_price && (
                            <>
                              <span>•</span>
                              <span>From ${show.min_price}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleImport('show', show)}
                        disabled={isImporting === show.id}
                        className="flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors disabled:opacity-50"
                      >
                        {isImporting === show.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Nearby Shows Results (for ZIP code searches) */}
              {localResults.nearbyShows && localResults.nearbyShows.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white/80 px-3 py-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Shows Near {localResults.zipInfo?.city}, {localResults.zipInfo?.state}
                  </h3>
                  <div className="max-h-80 overflow-y-auto">
                    {localResults.nearbyShows.slice(0, 8).map((show) => (
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
                          <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                            <Music className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate">
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
                    
                    {localResults.nearbyShows.length > 8 && (
                      <Link
                        href={`/nearby/${debouncedQuery}`}
                        onClick={clearSearch}
                        className="block p-3 text-center text-white/80 hover:text-white hover:bg-white/5 transition-colors rounded-lg border border-white/10 mx-3 mt-2"
                      >
                        View all {localResults.nearbyShows.length} shows →
                      </Link>
                    )}
                  </div>
                </div>
              )}
              
              {/* ZIP code with no shows */}
              {localResults.zipInfo && (!localResults.nearbyShows || localResults.nearbyShows.length === 0) && (
                <div className="p-4 text-center text-white/60">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <div className="mb-2">No upcoming shows found near</div>
                  <div className="text-white/80 font-medium">
                    {localResults.zipInfo.city}, {localResults.zipInfo.state}
                  </div>
                  <div className="text-sm text-white/40 mt-2">
                    Try searching for artists or a different area
                  </div>
                </div>
              )}

              {/* No Results */}
              {localResults.artists.length === 0 && 
               externalResults.artists.length === 0 &&
               externalResults.shows.length === 0 &&
               (!localResults.nearbyShows || localResults.nearbyShows.length === 0) && 
               !localResults.zipInfo && 
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

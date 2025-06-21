'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Search, Loader2, Music, Calendar, MapPin, Plus, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

function SearchContent() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [artists, setArtists] = useState<any[]>([])
  const [shows, setShows] = useState<any[]>([])
  const [venues, setVenues] = useState<any[]>([])
  const [isImporting, setIsImporting] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClientComponentClient()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Get query from URL on mount
  useEffect(() => {
    const q = searchParams.get('q')
    if (q) {
      setSearchQuery(q)
      performSearch(q)
    }
    inputRef.current?.focus()
  }, [searchParams])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery)
      } else {
        setArtists([])
        setShows([])
        setVenues([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const performSearch = async (query: string) => {
    setIsLoading(true)
    
    try {
      // Check if query looks like a zip code (5 digits)
      const isZipCode = /^\d{5}$/.test(query.trim())
      
      if (isZipCode) {
        // Handle ZIP code search - use local RPC for nearby shows
        const { data: nearbyShows } = await supabase.rpc('get_nearby_shows', {
          p_zip_code: query,
          p_radius_km: 80 // ~50 miles
        })
        
        // Convert nearby shows to show format
        const enrichedShows = (nearbyShows || []).map((show: any) => ({
          id: show.show_id,
          title: show.show_name,
          date: show.show_date,
          status: 'upcoming',
          artist: {
            name: show.artist_name,
            slug: show.artist_slug,
            image_url: show.artist_image
          },
          venue: {
            name: show.venue_name,
            city: show.venue_city,
            state: show.venue_state
          }
        }))
        
        setShows(enrichedShows)
        setArtists([])
        setVenues([])
        return
      }

      // For non-ZIP queries: prioritize external APIs as per MASTER-FIX-PLUS.md
      // Step 1: Search external APIs first (Ticketmaster Discovery + Spotify)
      let externalResults: any = null
      try {
        const response = await fetch(`/api/search/external?q=${encodeURIComponent(query)}`)
        if (response.ok) {
          externalResults = await response.json()
        }
      } catch (error) {
        console.error('External search failed:', error)
      }

      // Step 2: Collect external artists and shows
      const externalArtists = externalResults?.results?.artists || []
      const externalShows = externalResults?.results?.shows || []

      // Step 3: Search local database for additional results
      const [localArtistsResult, localShowsResult, venueResult] = await Promise.all([
        supabase
          .from('artists')
          .select('id, name, slug, image_url, genres, popularity')
          .ilike('name', `%${query}%`)
          .order('popularity', { ascending: false })
          .limit(10),
        supabase
          .from('shows')
          .select(`
            id, title, date, status, artist_id, venue_id,
            artists!inner(name, slug, image_url),
            venues!inner(name, city, state)
          `)
          .or(`title.ilike.%${query}%,artists.name.ilike.%${query}%`)
          .eq('status', 'upcoming')
          .gte('date', new Date().toISOString())
          .order('date', { ascending: true })
          .limit(10),
        supabase
          .from('venues')
          .select('id, name, city, state, capacity')
          .or(`name.ilike.%${query}%,city.ilike.%${query}%`)
          .limit(10)
      ])

      // Step 4: Transform and merge results, prioritizing external data
      const localArtists = localArtistsResult.data || []
      const localShows = localShowsResult.data || []

      // Convert external artists to consistent format
      const transformedExternalArtists = externalArtists.map((artist: any) => ({
        id: `external-${artist.id}`,
        name: artist.name,
        slug: null,
        image_url: artist.image_url,
        genres: artist.genres || [],
        popularity: artist.popularity,
        source: 'external',
        can_import: true,
        external_data: artist
      }))

      // Convert external shows to consistent format
      const transformedExternalShows = externalShows.map((show: any) => ({
        id: `external-${show.id}`,
        title: show.name,
        date: show.date,
        status: show.status,
        artist: {
          name: show.artist_name,
          image_url: show.artist_image
        },
        venue: {
          name: show.venue_name,
          city: show.venue_city,
          state: show.venue_state
        },
        source: 'external',
        can_import: true,
        external_data: show
      }))

      // Convert local shows to consistent format
      const transformedLocalShows = localShows.map((show: any) => {
        const artist = Array.isArray(show.artists) ? show.artists[0] : show.artists
        const venue = Array.isArray(show.venues) ? show.venues[0] : show.venues
        return {
          ...show,
          artist,
          venue,
          source: 'local'
        }
      })

      // Step 5: Prioritize external results, then add local ones
      const mergedArtists = [
        ...transformedExternalArtists,
        ...localArtists.map((artist: any) => ({ ...artist, source: 'local' }))
      ].slice(0, 10) // Limit total results

      const mergedShows = [
        ...transformedExternalShows,
        ...transformedLocalShows
      ].slice(0, 10) // Limit total results

      setArtists(mergedArtists)
      setShows(mergedShows)
      setVenues(venueResult.data || [])

    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async (type: 'artist' | 'show', data: any) => {
    setIsImporting(data.id)
    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          ...(type === 'artist' ? {
            id: data.external_data.id,
            name: data.external_data.name,
            popularity: data.external_data.popularity,
            followers: data.external_data.followers,
            genres: data.external_data.genres,
            image_url: data.external_data.image_url,
            spotify_url: data.external_data.spotify_url
          } : {
            id: data.external_data.id,
            name: data.external_data.name,
            artist_name: data.external_data.artist_name,
            artist_image: data.external_data.artist_image,
            venue_name: data.external_data.venue_name,
            venue_city: data.external_data.venue_city,
            venue_state: data.external_data.venue_state,
            date: data.external_data.date,
            status: data.external_data.status,
            ticket_url: data.external_data.ticket_url,
            min_price: data.external_data.min_price,
            max_price: data.external_data.max_price
          })
        })
      })

      const result = await response.json()
      
      if (result.success) {
        if (type === 'artist') {
          router.push(`/artists/${result.slug}`)
        } else if (type === 'show') {
          router.push(`/shows/${result.show_id}`)
        }
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
    <div className="min-h-screen bg-gray-900">
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 text-white">Search</h1>
          <p className="text-gray-400 mb-6">Find artists, shows, and venues</p>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search for artists, venues, or cities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-gray-600 transition-all"
            />
          </div>
        </div>

        {/* Search Results */}
        {searchQuery.trim().length >= 2 && (
          <div className="space-y-8">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                {/* Artists */}
                {artists.length > 0 && (
                  <section>
                    <h2 className="text-xl font-semibold mb-4 text-white">Artists</h2>
                    <div className="space-y-3">
                      {artists.map((artist) => {
                        const isExternal = artist.source === 'external'
                        const hasSlug = artist.slug && !isExternal
                        
                        if (hasSlug) {
                          // Local artist with slug - use Link
                          return (
                            <Link
                              key={artist.id}
                              href={`/artists/${artist.slug}`}
                              className="block p-4 rounded-xl bg-gray-800 hover:bg-gray-750 transition-all border border-gray-700 hover:border-gray-600"
                            >
                              <div className="flex items-center gap-4">
                                {artist.image_url ? (
                                  <img
                                    src={artist.image_url}
                                    alt={artist.name}
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                                    <Music className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <h3 className="font-semibold text-white">{artist.name}</h3>
                                  {artist.genres && artist.genres.length > 0 && (
                                    <p className="text-sm text-gray-400">
                                      {artist.genres.slice(0, 2).join(', ')}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-500">In Database</p>
                                </div>
                              </div>
                            </Link>
                          )
                        } else {
                          // External artist - show import button
                          return (
                            <div
                              key={artist.id}
                              className="p-4 rounded-xl bg-gray-800 border border-gray-700 hover:border-gray-600 transition-all"
                            >
                              <div className="flex items-center gap-4">
                                {artist.image_url ? (
                                  <img
                                    src={artist.image_url}
                                    alt={artist.name}
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
                                    <Music className="w-6 h-6 text-white" />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-white">{artist.name}</h3>
                                    <ExternalLink className="w-4 h-4 text-green-400" />
                                  </div>
                                  {artist.genres && artist.genres.length > 0 && (
                                    <p className="text-sm text-gray-400">
                                      {artist.genres.slice(0, 2).join(', ')}
                                    </p>
                                  )}
                                  <p className="text-xs text-green-400">From Spotify • {artist.external_data?.followers?.toLocaleString()} followers</p>
                                </div>
                                <button
                                  onClick={() => handleImport('artist', artist)}
                                  disabled={isImporting === artist.id}
                                  className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-colors disabled:opacity-50"
                                >
                                  {isImporting === artist.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Plus className="w-4 h-4" />
                                  )}
                                  Add to Database
                                </button>
                              </div>
                            </div>
                          )
                        }
                      })}
                    </div>
                  </section>
                )}

                {/* Shows */}
                {shows.length > 0 && (
                  <section>
                    <h2 className="text-xl font-semibold mb-4 text-white">Upcoming Shows</h2>
                    <div className="space-y-3">
                      {shows.map((show) => {
                        const isExternal = show.source === 'external'
                        const hasValidId = show.id && !show.id.startsWith('external-')
                        
                        if (hasValidId && !isExternal) {
                          // Local show - use Link
                          return (
                            <Link
                              key={show.id}
                              href={`/shows/${show.id}`}
                              className="block p-4 rounded-xl bg-gray-800 hover:bg-gray-750 transition-all border border-gray-700 hover:border-gray-600"
                            >
                              <div className="flex items-start gap-4">
                                {show.artist?.image_url ? (
                                  <img
                                    src={show.artist.image_url}
                                    alt={show.artist.name}
                                    className="w-12 h-12 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center">
                                    <Music className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <h3 className="font-semibold text-white">
                                    {show.artist?.name || 'Unknown Artist'}
                                  </h3>
                                  <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                                    <MapPin className="w-3 h-3" />
                                    <span>{show.venue?.name}, {show.venue?.city}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>
                                      {new Date(show.date).toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">In Database</p>
                                </div>
                              </div>
                            </Link>
                          )
                        } else {
                          // External show - show import button
                          return (
                            <div
                              key={show.id}
                              className="p-4 rounded-xl bg-gray-800 border border-gray-700 hover:border-gray-600 transition-all"
                            >
                              <div className="flex items-start gap-4">
                                {show.artist?.image_url ? (
                                  <img
                                    src={show.artist.image_url}
                                    alt={show.artist.name}
                                    className="w-12 h-12 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
                                    <Music className="w-6 h-6 text-white" />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-white">
                                      {show.artist?.name || show.title}
                                    </h3>
                                    <ExternalLink className="w-4 h-4 text-blue-400" />
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                                    <MapPin className="w-3 h-3" />
                                    <span>{show.venue?.name}, {show.venue?.city}, {show.venue?.state}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>
                                      {new Date(show.date).toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </span>
                                    {show.external_data?.min_price && (
                                      <>
                                        <span>•</span>
                                        <span>From ${show.external_data.min_price}</span>
                                      </>
                                    )}
                                  </div>
                                  <p className="text-xs text-blue-400 mt-1">From Ticketmaster</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <button
                                    onClick={() => handleImport('show', show)}
                                    disabled={isImporting === show.id}
                                    className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors disabled:opacity-50"
                                  >
                                    {isImporting === show.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Plus className="w-4 h-4" />
                                    )}
                                    Add Show
                                  </button>
                                  {show.external_data?.ticket_url && (
                                    <a
                                      href={show.external_data.ticket_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors text-center"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                      Tickets
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        }
                      })}
                    </div>
                  </section>
                )}

                {/* Venues */}
                {venues.length > 0 && (
                  <section>
                    <h2 className="text-xl font-semibold mb-4 text-white">Venues</h2>
                    <div className="space-y-3">
                      {venues.map((venue) => (
                        <div
                          key={venue.id}
                          className="p-4 rounded-xl bg-gray-800 border border-gray-700"
                        >
                          <h3 className="font-semibold text-white">{venue.name}</h3>
                          <p className="text-sm text-gray-400">
                            {venue.city}, {venue.state}
                            {venue.capacity && ` • Capacity: ${venue.capacity.toLocaleString()}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* No Results */}
                {artists.length === 0 && shows.length === 0 && venues.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-400 text-lg">
                      No results found for "{searchQuery}"
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Empty State */}
        {searchQuery.trim().length < 2 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              Start typing to search for artists, shows, and venues
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
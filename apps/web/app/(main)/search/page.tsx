'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Search, Loader2, Music, Calendar, MapPin } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function SearchContent() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [artists, setArtists] = useState<any[]>([])
  const [shows, setShows] = useState<any[]>([])
  const [venues, setVenues] = useState<any[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClientComponentClient()
  const searchParams = useSearchParams()

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
      // Search artists
      const { data: artistData } = await supabase
        .from('artists')
        .select('id, name, slug, image_url, genres, popularity')
        .ilike('name', `%${query}%`)
        .order('popularity', { ascending: false })
        .limit(10)
      
      // Search shows with artist and venue info
      const { data: showData } = await supabase
        .from('shows')
        .select('id, title, date, status, artist_id, venue_id')
        .ilike('title', `%${query}%`)
        .eq('status', 'upcoming')
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(10)
      
      // Get artist and venue data for shows
      if (showData && showData.length > 0) {
        const artistIds = [...new Set(showData.map(s => s.artist_id))]
        const venueIds = [...new Set(showData.map(s => s.venue_id))]
        
        const [{ data: showArtists }, { data: showVenues }] = await Promise.all([
          supabase
            .from('artists')
            .select('id, name, slug, image_url')
            .in('id', artistIds),
          supabase
            .from('venues')
            .select('id, name, city, state')
            .in('id', venueIds)
        ])
        
        const artistMap = new Map(showArtists?.map(a => [a.id, a]) || [])
        const venueMap = new Map(showVenues?.map(v => [v.id, v]) || [])
        
        const enrichedShows = showData.map(show => ({
          ...show,
          artist: artistMap.get(show.artist_id),
          venue: venueMap.get(show.venue_id)
        }))
        
        setShows(enrichedShows)
      } else {
        setShows([])
      }
      
      // Search venues
      const { data: venueData } = await supabase
        .from('venues')
        .select('id, name, city, state, capacity')
        .or(`name.ilike.%${query}%,city.ilike.%${query}%`)
        .limit(10)
      
      setArtists(artistData || [])
      setVenues(venueData || [])
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
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
                      {artists.map((artist) => (
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
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {/* Shows */}
                {shows.length > 0 && (
                  <section>
                    <h2 className="text-xl font-semibold mb-4 text-white">Upcoming Shows</h2>
                    <div className="space-y-3">
                      {shows.map((show) => (
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
                            </div>
                          </div>
                        </Link>
                      ))}
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
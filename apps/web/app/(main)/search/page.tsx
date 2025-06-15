'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/lib/graphql-client'
import { SEARCH_ALL } from '@/lib/graphql/queries'
import { Search, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface SearchResult {
  artists: any[]
  venues: any[]
  shows: any[]
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [importingArtist, setImportingArtist] = useState(false)
  const client = useGraphQLClient()
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Search query
  const { data: searchData, isLoading: isLoadingSearch } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return null
      return client.request(SEARCH_ALL, { query: debouncedQuery })
    },
    enabled: !!debouncedQuery,
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
        window.location.href = `/artists/${data.artist.slug}`
      } catch (error) {
        console.error('Error importing artist:', error)
        alert('Failed to import artist. Please try again.')
      } finally {
        setImportingArtist(false)
      }
    } else {
      window.location.href = `/artists/${artist.slug}`
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-headline font-bold mb-3 sm:mb-4 gradient-text">
            Search
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg font-body mb-6">
            Find artists, shows, and venues
          </p>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search for artists, venues, or cities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-lg bg-card border border-border rounded-2xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            />
          </div>
        </div>

        {/* Search Results */}
        {debouncedQuery && (
          <div className="space-y-6">
            {isLoadingSearch ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : searchResults ? (
              <>
                {/* Artists */}
                {searchResults.artists?.length > 0 && (
                  <section>
                    <h2 className="text-xl font-semibold mb-4 text-foreground">Artists</h2>
                    <div className="space-y-3">
                      {searchResults.artists.map((artist: any) => (
                        <button
                          key={artist.id || artist.ticketmasterId}
                          onClick={() => handleArtistImport(artist)}
                          disabled={importingArtist}
                          className="w-full flex items-center gap-4 p-4 rounded-xl bg-card hover:bg-card/80 transition-all duration-200 border border-border/50 hover:border-border hover:shadow-lg text-left"
                        >
                          {artist.imageUrl ? (
                            <img
                              src={artist.imageUrl}
                              alt={artist.name}
                              className="w-12 h-12 rounded-full object-cover border border-border/50"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-lg font-bold text-muted-foreground">
                                {artist.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground truncate">
                              {artist.name}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {artist.isFromApi ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-600 rounded text-xs">
                                  New
                                </span>
                              ) : (
                                <span>Artist</span>
                              )}
                              {artist.genres?.length > 0 && (
                                <span>• {artist.genres.slice(0, 2).join(', ')}</span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* Shows */}
                {searchResults.shows?.length > 0 && (
                  <section>
                    <h2 className="text-xl font-semibold mb-4 text-foreground">Shows</h2>
                    <div className="space-y-3">
                      {searchResults.shows.map((show: any) => (
                        <Link
                          key={show.id}
                          href={`/shows/${show.id}`}
                          className="block p-4 rounded-xl bg-card hover:bg-card/80 transition-all duration-200 border border-border/50 hover:border-border hover:shadow-lg"
                        >
                          <div className="flex items-start gap-4">
                            {show.artist?.imageUrl && (
                              <img
                                src={show.artist.imageUrl}
                                alt={show.artist.name}
                                className="w-12 h-12 rounded-lg object-cover border border-border/50"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground truncate">
                                {show.artist?.name}
                              </h3>
                              <p className="text-sm text-muted-foreground truncate">
                                {show.venue?.name}, {show.venue?.city}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(show.date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {/* Venues */}
                {searchResults.venues?.length > 0 && (
                  <section>
                    <h2 className="text-xl font-semibold mb-4 text-foreground">Venues</h2>
                    <div className="space-y-3">
                      {searchResults.venues.map((venue: any) => (
                        <div
                          key={venue.id}
                          className="p-4 rounded-xl bg-card border border-border/50"
                        >
                          <h3 className="font-semibold text-foreground truncate">
                            {venue.name}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {venue.city}, {venue.state}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* No Results */}
                {!searchResults.artists?.length && 
                 !searchResults.shows?.length && 
                 !searchResults.venues?.length && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">
                      No results found for "{debouncedQuery}"
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  No results found for "{debouncedQuery}"
                </p>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!debouncedQuery && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">
              Start typing to search for artists, shows, and venues
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
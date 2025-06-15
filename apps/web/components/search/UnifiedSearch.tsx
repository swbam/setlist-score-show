'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, MapPin, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface SearchResult {
  artists: any[]
  venues: any[]
  shows: any[]
  zipCodeShows?: any[]
}

interface UnifiedSearchProps {
  placeholder?: string
  className?: string
  showResults?: boolean
  onResultClick?: () => void
}

export function UnifiedSearch({ 
  placeholder = "Search artists, venues, cities, or enter zip code...",
  className = "",
  showResults = true,
  onResultClick
}: UnifiedSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null)
  const [isLoadingSearch, setIsLoadingSearch] = useState(false)
  const [importingArtist, setImportingArtist] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  // Check if query is a zip code (5 digits)
  const isZipCode = (query: string) => /^\d{5}$/.test(query.trim())

  // Search functionality
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults(null)
      setShowSearchResults(false)
      return
    }

    const searchData = async () => {
      setIsLoadingSearch(true)
      setShowSearchResults(true)
      
      try {
        if (isZipCode(debouncedQuery)) {
          // Search by zip code using Ticketmaster API
          const response = await fetch(`/api/search-by-zip?zip=${encodeURIComponent(debouncedQuery.trim())}`)
          if (response.ok) {
            const data = await response.json()
            setSearchResults({ 
              artists: [], 
              venues: [], 
              shows: [], 
              zipCodeShows: data.shows || [] 
            })
          }
        } else {
          // Regular search
          const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
          if (response.ok) {
            const data = await response.json()
            setSearchResults(data)
          }
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsLoadingSearch(false)
      }
    }

    searchData()
  }, [debouncedQuery])

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
          imageUrl: artist.imageUrl,
          slug: artist.slug
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

  const handleResultClick = () => {
    setShowSearchResults(false)
    onResultClick?.()
  }

  return (
    <div ref={searchContainerRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 text-lg bg-card border border-border rounded-2xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
        />
      </div>

      {/* Search Results Dropdown */}
      {showResults && showSearchResults && debouncedQuery && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-xl z-50 max-h-96 overflow-y-auto">
          {isLoadingSearch ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : searchResults ? (
            <div className="p-4 space-y-4">
              {/* Zip Code Results */}
              {searchResults.zipCodeShows && searchResults.zipCodeShows.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-foreground">
                      Concerts near {debouncedQuery}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {searchResults.zipCodeShows.slice(0, 5).map((show: any, index: number) => (
                      <button
                        key={index}
                        onClick={() => {
                          handleArtistImport({
                            ticketmasterId: show.artistId,
                            name: show.artistName,
                            imageUrl: show.artistImage,
                            slug: show.artistName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                          })
                          handleResultClick()
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                      >
                        {show.artistImage && (
                          <img
                            src={show.artistImage}
                            alt={show.artistName}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {show.artistName}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {show.venueName} • {show.date}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {show.distance} miles away
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Search Results */}
              {searchResults.artists && searchResults.artists.length > 0 && (
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Artists</h3>
                  <div className="space-y-2">
                    {searchResults.artists.slice(0, 3).map((artist: any) => (
                      <button
                        key={artist.id || artist.ticketmasterId}
                        onClick={() => {
                          handleArtistImport(artist)
                          handleResultClick()
                        }}
                        disabled={importingArtist}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                      >
                        {artist.imageUrl ? (
                          <img
                            src={artist.imageUrl}
                            alt={artist.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-sm font-bold text-muted-foreground">
                              {artist.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {artist.name}
                          </p>
                          {artist.genres?.length > 0 && (
                            <p className="text-sm text-muted-foreground truncate">
                              {artist.genres.slice(0, 2).join(', ')}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Shows */}
              {searchResults.shows && searchResults.shows.length > 0 && (
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Shows</h3>
                  <div className="space-y-2">
                    {searchResults.shows.slice(0, 3).map((show: any) => (
                      <Link
                        key={show.id}
                        href={`/shows/${show.id}`}
                        onClick={handleResultClick}
                        className="block p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {show.artist?.imageUrl && (
                            <img
                              src={show.artist.imageUrl}
                              alt={show.artist.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {show.artist?.name}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {show.venue?.name}, {show.venue?.city}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(show.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {!searchResults.zipCodeShows?.length && 
               !searchResults.artists?.length && 
               !searchResults.shows?.length && 
               !searchResults.venues?.length && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No results found for "{debouncedQuery}"</p>
                  {!isZipCode(debouncedQuery) && (
                    <p className="text-sm mt-2">Try entering a 5-digit zip code to find nearby concerts</p>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
} 
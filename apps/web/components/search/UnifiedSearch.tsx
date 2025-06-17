'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, MapPin, Loader2, Music, Calendar, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

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
    <div ref={searchContainerRef} className={cn("relative", className)}>
      {/* Search Input */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-white transition-colors" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            "w-full pl-12 pr-4 py-3 text-base bg-white/10 backdrop-blur-xl border border-white/20",
            "rounded-[2px] text-white placeholder-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40",
            "transition-all duration-200",
            "hover:bg-white/15 hover:border-white/30"
          )}
        />
        {isLoadingSearch && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <Loader2 className="w-5 h-5 animate-spin text-white/60" />
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && showSearchResults && debouncedQuery && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-gray-900/95 backdrop-blur-2xl border border-white/10 rounded-[2px] shadow-2xl z-50 max-h-[500px] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {isLoadingSearch ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-white/60 mx-auto" />
                <p className="text-sm text-gray-400">Searching...</p>
              </div>
            </div>
          ) : searchResults ? (
            <div className="overflow-y-auto max-h-[490px] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {/* Zip Code Results */}
              {searchResults.zipCodeShows && searchResults.zipCodeShows.length > 0 && (
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <MapPin className="w-4 h-4 text-blue-400" />
                    </div>
                    <h3 className="font-semibold text-white">
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
                        className="w-full flex items-center gap-4 p-3 rounded-[2px] hover:bg-white/5 transition-all group"
                      >
                        {show.artistImage ? (
                          <img
                            src={show.artistImage}
                            alt={show.artistName}
                            className="w-12 h-12 rounded-[2px] object-cover border border-white/10"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-[2px] bg-white/10 flex items-center justify-center">
                            <Music className="w-6 h-6 text-white/40" />
                          </div>
                        )}
                        <div className="flex-1 text-left">
                          <p className="font-medium text-white group-hover:text-gray-200 transition-colors">
                            {show.artistName}
                          </p>
                          <p className="text-sm text-gray-400">
                            {show.venueName} • {show.date}
                          </p>
                          <p className="text-xs text-blue-400 mt-0.5">
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
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-[2px] bg-purple-500/20">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                    </div>
                    <h3 className="font-semibold text-white">Artists</h3>
                  </div>
                  <div className="space-y-2">
                    {searchResults.artists.slice(0, 3).map((artist: any) => (
                      <button
                        key={artist.id || artist.ticketmasterId}
                        onClick={() => {
                          handleArtistImport(artist)
                          handleResultClick()
                        }}
                        disabled={importingArtist}
                        className="w-full flex items-center gap-4 p-3 rounded-[2px] hover:bg-white/5 transition-all group disabled:opacity-50"
                      >
                        {artist.imageUrl ? (
                          <img
                            src={artist.imageUrl}
                            alt={artist.name}
                            className="w-12 h-12 rounded-[2px] object-cover border-2 border-white/10"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-[2px] bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border-2 border-white/10">
                            <span className="text-lg font-bold text-white">
                              {artist.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 text-left">
                          <p className="font-medium text-white group-hover:text-gray-200 transition-colors">
                            {artist.name}
                          </p>
                          {artist.genres?.length > 0 && (
                            <p className="text-sm text-gray-400">
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
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-[2px] bg-orange-500/20">
                      <Calendar className="w-4 h-4 text-orange-400" />
                    </div>
                    <h3 className="font-semibold text-white">Shows</h3>
                  </div>
                  <div className="space-y-2">
                    {searchResults.shows.slice(0, 3).map((show: any) => (
                      <Link
                        key={show.id}
                        href={`/shows/${show.id}`}
                        onClick={handleResultClick}
                        className="block p-3 rounded-[2px] hover:bg-white/5 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          {show.artist?.imageUrl ? (
                            <img
                              src={show.artist.imageUrl}
                              alt={show.artist.name}
                              className="w-12 h-12 rounded-[2px] object-cover border border-white/10"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-[2px] bg-white/10 flex items-center justify-center">
                              <Music className="w-6 h-6 text-white/40" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-white group-hover:text-gray-200 transition-colors">
                              {show.artist?.name}
                            </p>
                            <p className="text-sm text-gray-400">
                              {show.venue?.name}, {show.venue?.city}
                            </p>
                            <p className="text-xs text-orange-400 mt-0.5">
                              {new Date(show.date).toLocaleDateString('en-US', { 
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
                </div>
              )}

              {/* No Results */}
              {!searchResults.zipCodeShows?.length && 
               !searchResults.artists?.length && 
               !searchResults.shows?.length && 
               !searchResults.venues?.length && (
                <div className="text-center py-12 px-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-[2px] bg-white/5 mb-4">
                    <Search className="w-8 h-8 text-white/20" />
                  </div>
                  <p className="text-white/60 font-medium mb-2">No results found for "{debouncedQuery}"</p>
                  {!isZipCode(debouncedQuery) && (
                    <p className="text-sm text-gray-400">Try entering a 5-digit zip code to find nearby concerts</p>
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
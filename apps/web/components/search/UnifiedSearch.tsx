'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, Music, Calendar, MapPin, TrendingUp, X, Clock } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { SEARCH_ALL } from '@/lib/graphql/queries'
import { useDebouncedCallback } from 'use-debounce'

interface SearchResult {
  type: 'artist' | 'show' | 'venue' | 'song'
  id: string
  title: string
  subtitle?: string
  description?: string
  image?: string
  metadata?: {
    date?: string
    location?: string
    genres?: string[]
    followers?: number
    votes?: number
    popularity?: number
  }
  href: string
}

interface UnifiedSearchProps {
  className?: string
  placeholder?: string
  autoFocus?: boolean
  variant?: 'hero' | 'header' | 'mobile' | 'page'
  onResultClick?: (result: SearchResult) => void
}

interface SpotifyArtist {
  id: string
  name: string
  images: { url: string }[]
  genres: string[]
  followers: { total: number }
  external_urls: { spotify: string }
}

export function UnifiedSearch({ 
  className, 
  placeholder = "Search artists, shows, venues, or songs...", 
  autoFocus = false,
  variant = 'page',
  onResultClick
}: UnifiedSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [searchMode, setSearchMode] = useState<'local' | 'spotify'>('local')
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('theSetRecentSearches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to parse recent searches:', error)
      }
    }
  }, [])

  // Save recent searches to localStorage
  const saveRecentSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim()
    if (trimmed.length < 2) return

    const updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('theSetRecentSearches', JSON.stringify(updated))
  }

  // Handle search with debouncing
  const handleSearch = useDebouncedCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim()
    
    if (trimmed.length < 2) {
      setResults([])
      setIsLoading(false)
      setIsOpen(false)
      return
    }
    
    // Check if it's a ZIP code
    const isZip = /^\d{5}$/.test(trimmed)
    
    if (isZip) {
      router.push(`/nearby/${trimmed}`)
      setQuery('')
      setResults([])
      setIsOpen(false)
      return
    }
    
    setIsLoading(true)
    setIsOpen(true)
    
    try {
      // First try local database
      const { data: localResults } = await supabase
        .from('artists')
        .select('id, name, slug, image_url, genres, spotify_id')
        .ilike('name', `%${trimmed}%`)
        .order('popularity', { ascending: false })
        .limit(3)
      
      // If we have local results, show them
      if (localResults && localResults.length > 0) {
        setResults(localResults.map(artist => ({
          type: 'artist',
          id: artist.id,
          title: artist.name,
          image: artist.image_url,
          metadata: {
            followers: artist.followers,
            popularity: artist.popularity,
            genres: artist.genres,
          },
          href: `/artists/${artist.slug}`,
          source: 'local'
        })))
        setSearchMode('local')
      } else {
        // Otherwise search Spotify
        setSearchMode('spotify')
        const spotifyResults = await searchSpotify(trimmed)
        setResults(spotifyResults.map((artist: SpotifyArtist) => ({
          type: 'artist',
          id: artist.id,
          title: artist.name,
          image: artist.images[0]?.url,
          metadata: {
            followers: artist.followers.total,
            popularity: artist.popularity,
            genres: artist.genres,
          },
          href: artist.external_urls.spotify,
          source: 'spotify'
        })))
      }
    } catch (err) {
      console.error('Search error:', err)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, 300)

  const searchSpotify = async (searchQuery: string) => {
    try {
      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `grant_type=client_credentials&client_id=${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID}&client_secret=${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET}`
      })
      
      const { access_token } = await tokenResponse.json()
      
      const searchResponse = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=artist&limit=5`,
        {
          headers: { 'Authorization': `Bearer ${access_token}` }
        }
      )
      
      const data = await searchResponse.json()
      return data.artists?.items || []
    } catch (error) {
      console.error('Spotify search error:', error)
      return []
    }
  }

  const handleResultClick = async (result: SearchResult) => {
    saveRecentSearch(query)
    setIsOpen(false)
    setQuery('')
    if (onResultClick) {
      onResultClick(result)
    } else {
      if (result.source === 'spotify') {
        // Import from Spotify first
        setIsLoading(true)
        
        try {
          const response = await fetch('/api/sync-artist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ spotifyId: result.id })
          })
          
          if (response.ok) {
            const { artist: importedArtist } = await response.json()
            router.push(`/artists/${importedArtist.slug}`)
          }
        } catch (error) {
          console.error('Import error:', error)
        } finally {
          setIsLoading(false)
        }
      } else {
        // Local artist - navigate directly
        router.push(`/artists/${result.href.split('/').pop() || ''}`)
      }
    }
  }

  const handleRecentSearchClick = (recentQuery: string) => {
    setQuery(recentQuery)
    setIsOpen(true)
    inputRef.current?.focus()
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('theSetRecentSearches')
  }

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'artist': return Music
      case 'show': return Calendar
      case 'venue': return MapPin
      case 'song': return Music
      default: return Search
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  // Variant-specific styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'hero':
        return {
          container: "relative w-full max-w-2xl mx-auto",
          input: "w-full pl-12 pr-12 py-4 text-lg bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all",
          icon: "absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60",
          loadingIcon: "absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60 animate-spin",
          clearIcon: "absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60 hover:text-white transition-colors"
        }
      case 'header':
        return {
          container: "relative w-full max-w-md",
          input: "w-full pl-9 pr-9 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors",
          icon: "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground",
          loadingIcon: "absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin",
          clearIcon: "absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground hover:text-foreground transition-colors"
        }
      case 'mobile':
        return {
          container: "relative w-full",
          input: "w-full pl-10 pr-10 py-3 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors",
          icon: "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground",
          loadingIcon: "absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin",
          clearIcon: "absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground hover:text-foreground transition-colors"
        }
      default: // 'page'
        return {
          container: "relative w-full max-w-2xl",
          input: "w-full pl-10 pr-10 py-3 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors",
          icon: "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground",
          loadingIcon: "absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin",
          clearIcon: "absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground hover:text-foreground transition-colors"
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <div ref={searchRef} className={cn(styles.container, className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className={styles.icon} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            handleSearch(e.target.value)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (!isOpen) return
            switch (e.key) {
              case 'ArrowDown':
                e.preventDefault()
                setSelectedIndex(prev => 
                  prev < results.length - 1 ? prev + 1 : prev
                )
                break
              case 'ArrowUp':
                e.preventDefault()
                setSelectedIndex(prev => prev > 0 ? prev - 1 : prev)
                break
              case 'Enter':
                e.preventDefault()
                if (selectedIndex >= 0 && results[selectedIndex]) {
                  handleResultClick(results[selectedIndex])
                } else if (query.trim()) {
                  saveRecentSearch(query)
                  // Navigate to search page if no specific result selected
                  window.location.href = `/search?q=${encodeURIComponent(query.trim())}`
                }
                break
              case 'Escape':
                setIsOpen(false)
                setSelectedIndex(-1)
                inputRef.current?.blur()
                break
            }
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={styles.input}
        />
        {isLoading ? (
          <Loader2 className={styles.loadingIcon} />
        ) : query && (
          <button
            onClick={() => {
              setQuery('')
              setResults([])
              setIsOpen(false)
              inputRef.current?.focus()
            }}
            className={styles.clearIcon}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-2 p-2 z-50 max-h-96 overflow-y-auto bg-background border border-border shadow-lg">
          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between px-3 py-2">
                <h3 className="text-sm font-medium text-muted-foreground">Recent Searches</h3>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-1">
                {recentSearches.map((recentQuery, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(recentQuery)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    {recentQuery}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {query && results.length > 0 && (
            <div className="space-y-1">
              {results.map((result, index) => {
                const Icon = getResultIcon(result.type)
                const isSelected = index === selectedIndex
                
                return (
                  <Link
                    key={`${result.type}-${result.id}`}
                    href={result.href}
                    onClick={() => handleResultClick(result)}
                    className={cn(
                      "block p-3 rounded-lg transition-colors hover:bg-muted",
                      isSelected && "bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {/* Icon/Image */}
                      <div className="flex-shrink-0">
                        {result.image ? (
                          <img
                            src={result.image}
                            alt={result.title}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <Icon className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{result.title}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {result.type}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {result.subtitle && (
                            <span className="truncate">{result.subtitle}</span>
                          )}
                          {result.description && (
                            <>
                              <span>•</span>
                              <span className="truncate">{result.description}</span>
                            </>
                          )}
                        </div>

                        {/* Metadata */}
                        {result.metadata && (
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            {result.metadata.date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(result.metadata.date)}
                              </span>
                            )}
                            {result.metadata.votes !== undefined && (
                              <span className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                {result.metadata.votes} votes
                              </span>
                            )}
                            {result.metadata.followers && (
                              <span>{result.metadata.followers.toLocaleString()} followers</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* No Results */}
          {query && !isLoading && results.length === 0 && (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium mb-1">No results found</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Try searching for artists, shows, venues, or songs
              </p>
              <p className="text-xs text-muted-foreground">
                Press Enter to search our full database
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Searching and importing artists...</p>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

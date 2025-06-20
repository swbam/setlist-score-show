'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, Music, Calendar, MapPin, X } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useDebouncedCallback } from 'use-debounce'

interface SearchResult {
  type: 'artist' | 'show' | 'venue'
  id: string
  title: string
  subtitle?: string
  image?: string
  metadata?: {
    date?: string
    location?: string
    genres?: string[]
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

export function UnifiedSearch({ 
  className, 
  placeholder = "Search artists, shows, or ZIP codes...", 
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
      const searchResults: SearchResult[] = []
      
      // Search artists
      const { data: artistData } = await supabase
        .from('artists')
        .select('id, name, slug, image_url, genres, popularity')
        .ilike('name', `%${trimmed}%`)
        .order('popularity', { ascending: false })
        .limit(5)
      
      if (artistData) {
        searchResults.push(...artistData.map(artist => ({
          type: 'artist' as const,
          id: artist.id,
          title: artist.name,
          image: artist.image_url,
          metadata: {
            genres: artist.genres,
            popularity: artist.popularity
          },
          href: `/artists/${artist.slug}`
        })))
      }
      
      // Search shows
      const { data: showData } = await supabase
        .from('shows')
        .select(`
          id,
          title,
          date,
          artists!inner(name, slug, image_url),
          venues!inner(name, city, state)
        `)
        .or(`title.ilike.%${trimmed}%,artists.name.ilike.%${trimmed}%`)
        .eq('status', 'upcoming')
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(3)
      
      if (showData) {
        searchResults.push(...showData.map(show => {
          const artist = Array.isArray(show.artists) ? show.artists[0] : show.artists
          const venue = Array.isArray(show.venues) ? show.venues[0] : show.venues
          
          return {
            type: 'show' as const,
            id: show.id,
            title: show.title || `${artist?.name} at ${venue?.name}`,
            subtitle: `${artist?.name}`,
            image: artist?.image_url,
            metadata: {
              date: show.date,
              location: `${venue?.name}, ${venue?.city}, ${venue?.state}`
            },
            href: `/shows/${show.id}`
          }
        }))
      }
      
      setResults(searchResults)
    } catch (err) {
      console.error('Search error:', err)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, 300)

  const handleResultClick = (result: SearchResult) => {
    saveRecentSearch(query)
    setIsOpen(false)
    setQuery('')
    if (onResultClick) {
      onResultClick(result)
    }
  }

  const handleRecentSearchClick = (recentQuery: string) => {
    setQuery(recentQuery)
    handleSearch(recentQuery)
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('theSetRecentSearches')
  }

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'artist': return <Music className="w-4 h-4" />
      case 'show': return <Calendar className="w-4 h-4" />
      case 'venue': return <MapPin className="w-4 h-4" />
      default: return <Music className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'hero':
        return {
          container: "w-full max-w-2xl mx-auto",
          input: "w-full pl-12 pr-12 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-white/60 text-lg focus:outline-none focus:ring-2 focus:ring-white/30",
          dropdown: "mt-2 bg-white/95 backdrop-blur-md border-white/20",
          icon: "left-4 w-5 h-5 text-white/60"
        }
      case 'header':
        return {
          container: "w-full max-w-md",
          input: "w-full pl-10 pr-10 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50",
          dropdown: "mt-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
          icon: "left-3 w-4 h-4 text-gray-400"
        }
      case 'mobile':
        return {
          container: "w-full",
          input: "w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-primary/50",
          dropdown: "mt-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
          icon: "left-4 w-5 h-5 text-gray-400"
        }
      default:
        return {
          container: "w-full",
          input: "w-full pl-12 pr-12 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50",
          dropdown: "mt-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
          icon: "left-4 w-5 h-5 text-gray-400"
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <div ref={searchRef} className={cn(styles.container, className)}>
      <div className="relative">
        <Search className={cn("absolute top-1/2 -translate-y-1/2", styles.icon)} />
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            handleSearch(e.target.value)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={cn(styles.input, "transition-all")}
        />
        
        {/* Clear button */}
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setResults([])
              setIsOpen(false)
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/10 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className={cn("absolute top-1/2 -translate-y-1/2", query ? "right-12" : "right-4")}>
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>
      
      {/* Results dropdown */}
      {isOpen && (
        <div className={cn(
          "absolute top-full w-full rounded-xl shadow-2xl border overflow-hidden z-50 max-h-96 overflow-y-auto",
          styles.dropdown
        )}>
          {/* Recent searches */}
          {!query && recentSearches.length > 0 && (
            <div className="p-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent Searches</h4>
                <button 
                  onClick={clearRecentSearches}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-1">
                {recentSearches.map((recent, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(recent)}
                    className="w-full text-left px-2 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    {recent}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Search results */}
          {results.length > 0 && (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {results.map((result) => (
                <Link
                  key={result.id}
                  href={result.href}
                  onClick={() => handleResultClick(result)}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {/* Result image */}
                  <div className="flex-shrink-0">
                    {result.image ? (
                      <img
                        src={result.image}
                        alt={result.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                        {getResultIcon(result.type)}
                      </div>
                    )}
                  </div>
                  
                  {/* Result content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {result.title}
                    </p>
                    {result.subtitle && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {result.subtitle}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span className="capitalize">{result.type}</span>
                      {result.metadata?.date && (
                        <>
                          <span>•</span>
                          <span>{formatDate(result.metadata.date)}</span>
                        </>
                      )}
                      {result.metadata?.location && (
                        <>
                          <span>•</span>
                          <span className="truncate">{result.metadata.location}</span>
                        </>
                      )}
                      {result.metadata?.genres && result.metadata.genres.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="truncate">{result.metadata.genres.slice(0, 2).join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          
          {/* No results */}
          {query && !isLoading && results.length === 0 && (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="font-medium">No results found</p>
              <p className="text-sm mt-1">Try searching for artists, shows, or enter a ZIP code</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Music, Loader2 } from 'lucide-react'
import { useDebouncedCallback } from 'use-debounce'
import { cn } from '@/lib/utils'

interface Artist {
  id: string
  name: string
  imageUrl?: string
  genres: string[]
  upcomingShowsCount: number
  relevanceScore: number
  ticketmasterId: string
  slug: string
}

interface UnifiedSearchProps {
  placeholder?: string
  onResultClick?: (result: Artist) => void
  className?: string
  variant?: 'hero' | 'header' | 'mobile'
}

export function UnifiedSearch({ 
  placeholder = "Search artists on Ticketmaster...",
  onResultClick,
  className,
  variant = 'hero'
}: UnifiedSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Artist[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  
  // Debounced search function
  const debouncedSearch = useDebouncedCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim()
    
    if (trimmed.length < 2) {
      setResults([])
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      console.log(`🔍 Searching for: "${trimmed}"`)
      
      const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Search failed')
      }

      if (data.success) {
        setResults(data.artists || [])
        console.log(`📊 Found ${data.artists?.length || 0} artists`)
      } else {
        throw new Error(data.error || 'Search failed')
      }
    } catch (err) {
      console.error('Search error:', err)
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, 300)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    debouncedSearch(value)
  }

  const handleResultClick = (artist: Artist) => {
    console.log(`🎤 Selected artist: ${artist.name}`)
    setQuery('')
    setResults([])
    
    if (onResultClick) {
      onResultClick(artist)
    } else {
      // For now, go to a search results page showing this artist
      router.push(`/search?q=${encodeURIComponent(artist.name)}`)
    }
  }

  const inputStyles = {
    hero: "w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-white/60 text-lg",
    header: "w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm",
    mobile: "w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl"
  }
  
  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className={cn(
          "absolute top-1/2 -translate-y-1/2 text-gray-400",
          variant === 'hero' ? "left-4 w-5 h-5" : "left-3 w-4 h-4"
        )} />
        
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={cn(
            inputStyles[variant],
            "transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
          )}
        />
        
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>
      
      {/* Results dropdown */}
      {(results.length > 0 || error) && (
        <div className={cn(
          "absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 max-h-96 overflow-y-auto",
          variant === 'hero' && "backdrop-blur-md bg-white/95 dark:bg-gray-800/95"
        )}>
          {error ? (
            <div className="p-4 text-center text-red-600 dark:text-red-400">
              <p className="font-medium">Search Error</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : (
            <>
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Found {results.length} artist{results.length !== 1 ? 's' : ''} on Ticketmaster
                </p>
              </div>
              
              {results.map((artist) => (
                <button
                  key={artist.id}
                  onClick={() => handleResultClick(artist)}
                  className="flex items-center gap-3 p-3 w-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  {artist.imageUrl ? (
                    <img
                      src={artist.imageUrl}
                      alt={artist.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                      <Music className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {artist.name}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      {artist.upcomingShowsCount > 0 && (
                        <span>{artist.upcomingShowsCount} upcoming show{artist.upcomingShowsCount !== 1 ? 's' : ''}</span>
                      )}
                      {artist.genres.length > 0 && (
                        <>
                          {artist.upcomingShowsCount > 0 && <span>•</span>}
                          <span>{artist.genres.slice(0, 2).join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                    Ticketmaster
                  </div>
                </button>
              ))}
              
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Powered by Ticketmaster • Live concert data
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

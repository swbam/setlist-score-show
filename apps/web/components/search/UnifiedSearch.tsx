'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Music, Loader2 } from 'lucide-react'
import { useDebouncedCallback } from 'use-debounce'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { cn } from '@/lib/utils'

interface UnifiedSearchProps {
  placeholder?: string
  className?: string
  variant?: 'hero' | 'header' | 'mobile'
  onResultClick?: (result: any) => void
}

interface Artist {
  id: string
  name: string
  slug: string
  image_url: string | null
  genres: string[]
  popularity: number
}

export function UnifiedSearch({ 
  placeholder = "Search artists or enter ZIP code...",
  className,
  variant = 'hero',
  onResultClick
}: UnifiedSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Artist[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const searchRef = useRef<HTMLDivElement>(null)
  
  // Close results on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const handleSearch = useDebouncedCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim()
    
    if (trimmed.length < 2) {
      setResults([])
      return
    }
    
    // Check if it's a ZIP code
    const isZip = /^\d{5}$/.test(trimmed)
    
    if (isZip) {
      // Track ZIP search (ignore errors)
      try {
        await supabase
          .from('search_analytics')
          .insert({
            query: trimmed,
            search_type: 'zip',
            result_count: 1
          })
      } catch (err) {
        // Ignore analytics errors
      }
      
      // Navigate directly to nearby shows
      router.push(`/nearby/${trimmed}`)
      setQuery('')
      setResults([])
      setShowResults(false)
      return
    }
    
    // Otherwise search artists
    setIsLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('artists')
        .select('id, name, slug, image_url, genres, popularity')
        .ilike('name', `%${trimmed}%`)
        .order('popularity', { ascending: false })
        .limit(5)
      
      if (!error && data) {
        setResults(data)
        
        // Track artist search (ignore errors)
        try {
          await supabase
            .from('search_analytics')
            .insert({
              query: trimmed,
              search_type: 'artist',
              result_count: data.length
            })
        } catch (err) {
          // Ignore analytics errors
        }
      }
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setIsLoading(false)
    }
  }, 300)
  
  const inputStyles = {
    hero: "w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-white/60 text-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all",
    header: "w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all",
    mobile: "w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
  }
  
  const iconStyles = {
    hero: "left-4 w-5 h-5",
    header: "left-3 w-4 h-4",
    mobile: "left-3 w-4 h-4"
  }
  
  return (
    <div ref={searchRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className={cn(
          "absolute top-1/2 -translate-y-1/2 text-gray-400",
          iconStyles[variant]
        )} />
        
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowResults(true)
            handleSearch(e.target.value)
          }}
          onFocus={() => setShowResults(true)}
          placeholder={placeholder}
          className={inputStyles[variant]}
        />
        
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>
      
      {/* ZIP code hint */}
      {query.match(/^\d{1,4}$/) && (
        <div className="absolute top-full mt-1 text-xs text-gray-400 dark:text-gray-500">
          <MapPin className="inline w-3 h-3 mr-1" />
          Enter a 5-digit ZIP code to find nearby shows
        </div>
      )}
      
      {/* Results dropdown */}
      {showResults && results.length > 0 && (
        <div className={cn(
          "absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50",
          variant === 'hero' && "backdrop-blur-md bg-white/95 dark:bg-gray-800/95"
        )}>
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-2 uppercase tracking-wider">
              Artists
            </div>
            {results.map((artist) => (
              <button
                key={artist.id}
                onClick={() => {
                  router.push(`/artists/${artist.slug}`)
                  setQuery('')
                  setResults([])
                  setShowResults(false)
                  onResultClick?.({ type: 'artist', data: artist })
                }}
                className="flex items-center gap-3 p-3 w-full hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-left group"
              >
                {artist.image_url ? (
                  <img
                    src={artist.image_url}
                    alt={artist.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-white dark:ring-gray-700 group-hover:ring-teal-500 transition-all"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <Music className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">
                    {artist.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {artist.genres?.slice(0, 2).join(', ') || 'Artist'}
                  </p>
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  {artist.popularity}% popular
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* No results */}
      {showResults && query.length >= 2 && !isLoading && results.length === 0 && !query.match(/^\d{5}$/) && (
        <div className={cn(
          "absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 z-50",
          variant === 'hero' && "backdrop-blur-md bg-white/95 dark:bg-gray-800/95"
        )}>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            No artists found for "{query}"
          </p>
        </div>
      )}
    </div>
  )
}
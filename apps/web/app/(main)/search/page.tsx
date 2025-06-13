'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/lib/graphql-client'
import { SEARCH_ALL } from '@/lib/graphql/queries'
import { Search, Music, Calendar, Users } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

function SearchPageContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery)
  const client = useGraphQLClient()
  const [importingArtist, setImportingArtist] = useState(false)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
      // Update URL query param without navigating away (shallow)
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        if (searchQuery) {
          url.searchParams.set('q', searchQuery)
        } else {
          url.searchParams.delete('q')
        }
        window.history.replaceState({}, '', url)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return null
      return client.request(SEARCH_ALL, { query: debouncedQuery })
    },
    enabled: !!debouncedQuery,
  })

  const results = (data as any)?.search

  const handleArtistImport = async (artist: any) => {
    if (artist.isFromApi) {
      try {
        console.log('Importing artist from Ticketmaster:', artist.name)
        
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
        
        if (!response.ok) {
          throw new Error('Failed to import artist')
        }
        
        const data = await response.json()
        
        // Navigate to artist page
        window.location.href = `/artists/${data.artist.slug}`
      } catch (error) {
        console.error('Error importing artist:', error)
        alert('Failed to import artist. Please try again.')
      } finally {
        setImportingArtist(false)
      }
    } else {
      // Artist already in DB, just navigate
      window.location.href = `/artists/${artist.slug}`
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-6 gradient-text">Search</h1>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for artists, shows, or songs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  setDebouncedQuery(searchQuery)
                }
              }}
              className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors text-lg"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="space-y-8">
            <SearchSectionSkeleton title="Artists" />
            <SearchSectionSkeleton title="Shows" />
            <SearchSectionSkeleton title="Songs" />
          </div>
        ) : !results || !debouncedQuery ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">
              {!debouncedQuery 
                ? 'Start typing to search...' 
                : 'No results found. Try a different search term.'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Artists Section */}
            {results.artists?.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-6 h-6 text-teal-500" />
                  Artists
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {results.artists.map((artist: any) => (
                    <button
                      key={artist.id}
                      onClick={() => handleArtistImport(artist)}
                      disabled={importingArtist}
                      className="card-base p-8 flex items-center gap-6 w-full text-left group"
                    >
                      {artist.imageUrl && (
                        <div className="flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
                          <img
                            src={artist.imageUrl}
                            alt={artist.name}
                            className="w-20 h-20 rounded-2xl object-cover border border-border shadow-medium"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-2xl font-headline font-bold mb-2 text-foreground group-hover:gradient-text transition-all duration-300">
                          {artist.name}
                        </h3>
                        <p className="text-base text-muted-foreground font-body">
                          {artist.isFromApi ? 'Click to import from Ticketmaster' : 'Artist'}
                        </p>
                      </div>
                      {artist.isFromApi && (
                        <span className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium">
                          Import
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Shows Section */}
            {results.shows?.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-teal-500" />
                  Shows
                </h2>
                <div className="space-y-3">
                  {results.shows.map((show: any) => (
                    <Link
                      key={show.id}
                      href={`/shows/${show.id}`}
                      className="gradient-card rounded-lg p-4 border border-gray-800 hover:border-teal-500/30 transition-all duration-300 card-hover block"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{show.artist.name}</h3>
                          <p className="text-gray-400">
                            {show.venue.name} • {show.venue.city}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(show.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-teal-400">
                          Vote Now →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Songs Section */}
            {results.songs?.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Music className="w-6 h-6 text-teal-500" />
                  Songs
                </h2>
                <div className="space-y-3">
                  {results.songs.map((song: any) => (
                    <div
                      key={song.id}
                      className="gradient-card rounded-lg p-4 border border-gray-800"
                    >
                      <h3 className="font-semibold">{song.title}</h3>
                      <p className="text-sm text-gray-400">by {song.artist.name}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function SearchSectionSkeleton({ title }: { title: string }) {
  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4">{title}</h2>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </section>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  )
}
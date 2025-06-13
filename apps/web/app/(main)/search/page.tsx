'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Search, Music, Calendar, Users, Plus, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

function SearchPageContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery)
  const [importingArtist, setImportingArtist] = useState(false)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return null
      
      try {
        // Search Ticketmaster API directly for artists
        const ticketmasterUrl = `https://app.ticketmaster.com/discovery/v2/attractions.json?keyword=${encodeURIComponent(debouncedQuery)}&apikey=k8GrSAkbFaN0w7qDxGl7ohr8LwdAQm9b&size=20&classificationName=music`
        
        console.log('Searching Ticketmaster for:', debouncedQuery)
        
        const tmResponse = await fetch(ticketmasterUrl)
        
        if (!tmResponse.ok) {
          console.error('Ticketmaster API error:', tmResponse.status)
          throw new Error('Ticketmaster API error')
        }

        const tmData = await tmResponse.json()
        const tmArtists = tmData._embedded?.attractions || []
        
        console.log(`Found ${tmArtists.length} artists from Ticketmaster`)

        // Transform Ticketmaster artists and sort by popularity (upcoming events count)
        const apiArtists = tmArtists
          .map((tm: any) => ({
            id: `tm_${tm.id}`, // Temporary ID
            ticketmasterId: tm.id,
            name: tm.name,
            slug: tm.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
            imageUrl: tm.images?.[0]?.url || null,
            isFromApi: true, // Flag to indicate this needs to be imported
            popularity: tm.upcomingEvents?._total || 0, // Use upcoming events as popularity metric
            genre: tm.classifications?.[0]?.genre?.name || 'Music'
          }))
          .sort((a, b) => b.popularity - a.popularity) // Sort by popularity (most popular first)

        // Also search local database using Supabase
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const { data: dbArtists } = await supabase
          .from('artists')
          .select('id, name, slug, image_url, ticketmaster_id, popularity, followers')
          .ilike('name', `%${debouncedQuery}%`)
          .order('popularity', { ascending: false }) // Sort local artists by popularity too
          .limit(10)

        // Combine and deduplicate, preserving popularity sorting
        const dbArtistsFormatted = (dbArtists || []).map((a: any) => ({
          ...a,
          imageUrl: a.image_url,
          ticketmasterId: a.ticketmaster_id,
          popularity: a.popularity || a.followers || 0
        }))
        
        const allArtists = [...dbArtistsFormatted, ...apiArtists]
        
        // Deduplicate by name and sort by popularity
        const uniqueArtists = allArtists
          .reduce((acc: any[], artist) => {
            if (!acc.some(a => a.name.toLowerCase() === artist.name.toLowerCase())) {
              acc.push(artist)
            }
            return acc
          }, [])
          .sort((a, b) => b.popularity - a.popularity) // Final sort by popularity

        return {
          search: {
            artists: uniqueArtists,
            shows: [], // We can add show search later if needed
            songs: [], // We can add song search later if needed
            totalResults: uniqueArtists.length
          }
        }
      } catch (error) {
        console.error('Search error:', error)
        return {
          search: {
            artists: [],
            shows: [],
            songs: [],
            totalResults: 0
          }
        }
      }
    },
    enabled: !!debouncedQuery,
  })

  const results = data?.search || { artists: [], shows: [], songs: [], totalResults: 0 }

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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-6 gradient-text">Search</h1>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              placeholder="Search for artists, shows, or songs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  setDebouncedQuery(query)
                }
              }}
              className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors text-lg"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="space-y-8">
            <SearchSkeleton title="Artists" />
            <SearchSkeleton title="Shows" />
            <SearchSkeleton title="Songs" />
          </div>
        ) : !results || !debouncedQuery ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
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
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-foreground">
                  <Users className="w-6 h-6 text-primary" />
                  Artists
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {results.artists.map((artist: any) => (
                    <button
                      key={artist.id}
                      onClick={() => handleArtistImport(artist)}
                      disabled={importingArtist}
                      className="card-base p-4 flex items-center gap-3 w-full text-left group hover:bg-muted/20 transition-all duration-300"
                    >
                      {artist.imageUrl && (
                        <div className="flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
                          <img
                            src={artist.imageUrl}
                            alt={artist.name}
                            className="w-12 h-12 rounded-lg object-cover border border-border shadow-sm"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold mb-1 text-foreground group-hover:text-primary transition-colors duration-300 truncate">
                          {artist.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {artist.genre && (
                            <span className="truncate">{artist.genre}</span>
                          )}
                          {artist.popularity > 0 && (
                            <>
                              {artist.genre && <span>•</span>}
                              <span className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                {artist.popularity}
                              </span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {artist.isFromApi ? 'Click to import from Ticketmaster' : 'View artist page'}
                        </p>
                      </div>
                      {artist.isFromApi && (
                        <div className="flex-shrink-0">
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-md font-medium">
                            Import
                          </span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Shows Section */}
            {results.shows?.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-foreground">
                  <Calendar className="w-6 h-6 text-primary" />
                  Shows
                </h2>
                <div className="space-y-3">
                  {results.shows.map((show: any) => (
                    <Link
                      key={show.id}
                      href={`/shows/${show.id}`}
                      className="card-base rounded-lg p-4 hover:bg-muted/20 transition-all duration-300 block"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">{show.artist.name}</h3>
                          <p className="text-muted-foreground">
                            {show.venue.name} • {show.venue.city}
                          </p>
                          <p className="text-sm text-muted-foreground/70 mt-1">
                            {new Date(show.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-primary">
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
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-foreground">
                  <Music className="w-6 h-6 text-primary" />
                  Songs
                </h2>
                <div className="space-y-3">
                  {results.songs.map((song: any) => (
                    <div
                      key={song.id}
                      className="card-base rounded-lg p-4"
                    >
                      <h3 className="font-semibold text-foreground">{song.title}</h3>
                      <p className="text-sm text-muted-foreground">by {song.artist.name}</p>
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

function SearchSkeleton({ title }: { title: string }) {
  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4 text-foreground">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="card-base p-4 flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-lg" />
            <div className="flex-1 min-w-0">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
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
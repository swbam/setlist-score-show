'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/lib/graphql-client'
import { GET_ARTISTS } from '@/lib/graphql/queries'
import { Search } from 'lucide-react'
import Link from 'next/link'
import { FeaturedArtists } from '@/components/artists/FeaturedArtists'

export default function ArtistsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const client = useGraphQLClient()

  const { data, isLoading } = useQuery({
    queryKey: ['artists', searchQuery],
    queryFn: async () => {
      return client.request(GET_ARTISTS, {
        limit: 50,
        search: searchQuery || undefined
      })
    },
    enabled: true,
  })

  const rawArtists = (data as any)?.artists || []
  
  // Transform artists data to match FeaturedArtists component interface
  const artists = rawArtists.map((artist: any) => ({
    id: artist.id,
    name: artist.name,
    slug: artist.slug,
    imageUrl: artist.imageUrl || artist.image_url,
    genres: artist.genres,
    upcomingShowsCount: artist.shows?.length || 0
  }))

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 gradient-text">Browse Artists</h1>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg mb-4 sm:mb-6">
            Find your favorite artists and vote on their upcoming shows
          </p>

          {/* Search Bar */}
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 bg-card border border-border rounded-lg text-sm sm:text-base text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Results */}
        {!artists?.length && !isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {searchQuery ? `No artists found for "${searchQuery}"` : 'No artists found'}
            </p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {artists.map((artist: any) => (
              <Link
                key={artist.id}
                href={`/artists/${artist.slug}`}
                className="card-base p-4 sm:p-6 group block"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  {/* Artist Image */}
                  <div className="flex-shrink-0">
                    {artist.imageUrl ? (
                      <img
                        src={artist.imageUrl}
                        alt={artist.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-muted flex items-center justify-center">
                        <span className="text-lg sm:text-xl font-headline font-bold text-muted-foreground">
                          {artist.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Artist Info */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl font-headline font-bold mb-2 text-foreground group-hover:gradient-text transition-all duration-300 line-clamp-1">
                      {artist.name}
                    </h2>
                    
                    <div className="space-y-1 text-sm sm:text-base text-muted-foreground font-body">
                      {artist.genres?.length > 0 && (
                        <div className="line-clamp-1">
                          {artist.genres.slice(0, 3).join(' • ')}
                        </div>
                      )}
                      <div>
                        {artist.upcomingShowsCount || 0} upcoming shows
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex items-center text-sm font-headline font-semibold text-primary group-hover:gradient-text transition-all duration-300">
                    <span className="whitespace-nowrap">View Shows →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
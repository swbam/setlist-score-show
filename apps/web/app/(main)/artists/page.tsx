'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/lib/graphql-client'
import { GET_ARTISTS } from '@/lib/graphql/queries'
import { Search } from 'lucide-react'
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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 gradient-text">Browse Artists</h1>
          <p className="text-muted-foreground text-lg mb-6">
            Find your favorite artists and vote on their upcoming shows
          </p>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              placeholder="Search artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
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
          <FeaturedArtists artists={artists} isLoading={isLoading} />
        )}
      </div>
    </div>
  )
}
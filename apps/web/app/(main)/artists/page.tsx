'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/lib/graphql-client'
import { GET_ARTISTS } from '@/lib/graphql/queries'
import { Search } from 'lucide-react'
import { ArtistGrid } from '@/components/artists/ArtistGrid'
import { Skeleton } from '@/components/ui/skeleton'

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

  const artists = data?.artists || []

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 gradient-text">Browse Artists</h1>
          <p className="text-gray-400 text-lg mb-6">
            Find your favorite artists and vote on their upcoming shows
          </p>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : !artists?.length ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              {searchQuery ? `No artists found for "${searchQuery}"` : 'No artists found'}
            </p>
          </div>
        ) : (
          <ArtistGrid artists={artists} />
        )}
      </div>
    </div>
  )
}
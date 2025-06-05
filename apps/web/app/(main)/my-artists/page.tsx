'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/lib/graphql-client'
import { GET_MY_ARTISTS } from '@/lib/graphql/queries'
import { useAuth } from '@/hooks/useAuth'
import { ArtistGrid } from '@/components/artists/ArtistGrid'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { Music2, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function MyArtistsPage() {
  const { user, loading } = useAuth()
  const client = useGraphQLClient()
  const router = useRouter()

  const { data, isLoading } = useQuery({
    queryKey: ['myArtists', user?.id],
    queryFn: async () => {
      return client.request(GET_MY_ARTISTS)
    },
    enabled: !!user,
  })

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null
  }

  const followedArtists = data?.myArtists || []

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 gradient-text">My Artists</h1>
          <p className="text-gray-400 text-lg">
            Artists you follow and their upcoming shows
          </p>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : !followedArtists.length ? (
          <div className="text-center py-16">
            <Music2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No artists yet</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Start following artists to see their upcoming shows and vote on setlists
            </p>
            <Link
              href="/artists"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-5 h-5" />
              Browse Artists
            </Link>
          </div>
        ) : (
          <div>
            <div className="mb-4 text-sm text-gray-400">
              Following {followedArtists.length} {followedArtists.length === 1 ? 'artist' : 'artists'}
            </div>
            <ArtistGrid 
              artists={followedArtists.map((fa: any) => ({
                ...fa.artist,
                followedAt: fa.followed_at
              }))} 
            />
          </div>
        )}
      </div>
    </div>
  )
}
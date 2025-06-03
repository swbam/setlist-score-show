import { Suspense } from 'react'
import { Metadata } from 'next'
import { ArtistGrid } from '@/components/artists/ArtistGrid'
import { ArtistSearch } from '@/components/artists/ArtistSearch'
import { ArtistGridSkeleton } from '@/components/artists/ArtistGridSkeleton'

export const metadata: Metadata = {
  title: 'Artists | Setlist Score Show',
  description: 'Browse all artists and discover upcoming shows',
}

export default function ArtistsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header with Gradient */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
          Discover Artists
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Browse your favorite artists and vote on the songs you want to hear at their upcoming shows
        </p>
      </div>

      {/* Search Section */}
      <div className="mb-8">
        <ArtistSearch />
      </div>

      {/* Artists Grid */}
      <Suspense fallback={<ArtistGridSkeleton />}>
        <ArtistGrid />
      </Suspense>
    </div>
  )
}
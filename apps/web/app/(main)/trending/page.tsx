import { Suspense } from 'react'
import { Metadata } from 'next'
import { TrendingShowsList } from '@/components/shows/TrendingShowsList'
import { ShowsListSkeleton } from '@/components/shows/ShowsListSkeleton'
import { TrendingFilters } from '@/components/shows/TrendingFilters'

export const metadata: Metadata = {
  title: 'Trending Shows | Setlist Score Show',
  description: 'Discover the most popular upcoming concerts based on fan votes',
}

export default function TrendingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header with Gradient Background */}
      <div className="mb-12 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 p-8 text-white">
        <h1 className="text-4xl font-bold mb-4">Trending Shows</h1>
        <p className="text-xl opacity-90 max-w-3xl">
          Discover the hottest upcoming concerts based on fan engagement and voting activity. 
          See which shows are generating the most buzz!
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-3xl font-bold text-teal-400 mb-2">15,234</div>
          <div className="text-gray-400">Active Voters Today</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-3xl font-bold text-cyan-400 mb-2">342</div>
          <div className="text-gray-400">Shows This Month</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-3xl font-bold text-purple-400 mb-2">89,421</div>
          <div className="text-gray-400">Total Votes Cast</div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="mb-8">
        <TrendingFilters />
      </div>

      {/* Trending Shows List */}
      <Suspense fallback={<ShowsListSkeleton />}>
        <TrendingShowsList />
      </Suspense>
    </div>
  )
}
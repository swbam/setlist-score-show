import { Suspense } from 'react'
import { Hero } from '@/components/home/Hero'
import { TrendingShowsSection } from '@/components/home/TrendingShowsSection'
import { FeaturedArtists } from '@/components/home/FeaturedArtists'
import { HowItWorks } from '@/components/home/HowItWorks'
import { RecentActivity } from '@/components/home/RecentActivity'
import { ShowsSectionSkeleton } from '@/components/home/ShowsSectionSkeleton'

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <Hero />

      {/* How It Works Section */}
      <HowItWorks />

      {/* Trending Shows Section */}
      <section className="py-16 bg-gray-800/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Trending Shows</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              See which upcoming concerts are generating the most excitement
            </p>
          </div>
          <Suspense fallback={<ShowsSectionSkeleton />}>
            <TrendingShowsSection />
          </Suspense>
        </div>
      </section>

      {/* Featured Artists Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Popular Artists</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Browse shows from your favorite artists
            </p>
          </div>
          <Suspense fallback={<ShowsSectionSkeleton />}>
            <FeaturedArtists />
          </Suspense>
        </div>
      </section>

      {/* Recent Activity Section */}
      <section className="py-16 bg-gray-800/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Live Voting Activity</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              See what songs fans are voting for right now
            </p>
          </div>
          <Suspense fallback={<div className="animate-pulse h-64 bg-gray-700 rounded-lg" />}>
            <RecentActivity />
          </Suspense>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to influence your favorite concerts?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of fans voting on setlists for upcoming shows
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/signup"
              className="px-8 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
            >
              Get Started Free
            </a>
            <a
              href="/artists"
              className="px-8 py-3 bg-transparent border-2 border-white rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition-colors duration-200"
            >
              Browse Artists
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
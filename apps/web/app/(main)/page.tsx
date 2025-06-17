import { Suspense } from 'react'
import Link from 'next/link'
import { TrendingUp, Calendar, Users, ArrowRight, Music, Play, Star, ChevronRight, Zap, MapPin, Sparkles } from 'lucide-react'
import { ShowCard } from '@/components/shows/ShowCard'
import { ClientSearchWrapper } from '@/components/homepage/ClientSearchWrapper'
import { getTopHomepageContent, type HomepageShow, type HomepageArtist } from '@/lib/supabase/queries/getTopHomepageContent'
import { ShowCardSkeleton, ArtistCardSkeleton } from '@/components/ui/loading-skeletons'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TheSet - Shape the Show, Vote the Setlist',
  description: 'Join millions of fans voting on their dream setlists. Your voice shapes what artists play live at concerts worldwide.',
  keywords: ['concert setlists', 'music voting', 'live music', 'concerts', 'setlist voting'],
  openGraph: {
    title: 'TheSet - Shape the Show, Vote the Setlist',
    description: 'Join millions of fans voting on their dream setlists. Your voice shapes what artists play live.',
    images: ['/og-image.jpg'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TheSet - Shape the Show, Vote the Setlist',
    description: 'Join millions of fans voting on their dream setlists. Your voice shapes what artists play live.',
    images: ['/og-image.jpg'],
  },
}

// Loading component for server-side suspense
function HomepageLoading() {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero Skeleton */}
      <div className="relative overflow-hidden bg-gradient-to-b from-black via-gray-900/50 to-black">
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center space-y-8">
            <div className="h-8 w-80 bg-white/10 rounded-full mx-auto animate-pulse" />
            <div className="space-y-4">
              <div className="h-16 w-96 bg-white/10 rounded-lg mx-auto animate-pulse" />
              <div className="h-16 w-80 bg-white/10 rounded-lg mx-auto animate-pulse" />
            </div>
            <div className="h-6 w-64 bg-white/10 rounded-lg mx-auto animate-pulse" />
            <div className="flex gap-4 justify-center">
              <div className="h-12 w-32 bg-white/10 rounded-sm animate-pulse" />
              <div className="h-12 w-32 bg-white/10 rounded-sm animate-pulse" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Content Skeleton */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="space-y-16">
          {/* Trending Shows Section */}
          <section>
            <div className="flex items-center justify-between mb-12">
              <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse" />
              <div className="h-6 w-16 bg-white/10 rounded-lg animate-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <ShowCardSkeleton key={i} variant="featured" />
              ))}
            </div>
          </section>
          
          {/* Featured Artists Section */}
          <section>
            <div className="flex items-center justify-between mb-12">
              <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse" />
              <div className="h-6 w-24 bg-white/10 rounded-lg animate-pulse" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <ArtistCardSkeleton key={i} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

// Error component for when data fetching fails
function HomepageError({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-red-500/20 mb-6">
          <Zap className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-gray-400 mb-6">
          We're having trouble loading the latest shows and artists. Please try again.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={retry}
            className="px-6 py-3 bg-white text-black rounded-sm font-semibold hover:bg-gray-100 transition-all"
          >
            Try Again
          </button>
          <Link
            href="/explore"
            className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-sm font-semibold hover:bg-white/20 transition-all"
          >
            Browse Shows
          </Link>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="text-sm text-gray-500 cursor-pointer">Error Details</summary>
            <pre className="text-xs text-red-400 mt-2 overflow-auto bg-black/50 p-2 rounded">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

// Main homepage content component
async function HomepageContent() {
  try {
    const { shows: trendingShows, artists: featuredArtists } = await getTopHomepageContent()

    const genres = [
      { name: 'Rock', id: 'rock' },
      { name: 'Pop', id: 'pop' },
      { name: 'Hip-Hop', id: 'hip-hop' },
      { name: 'Country', id: 'country' },
      { name: 'Electronic', id: 'electronic' },
      { name: 'R&B', id: 'rnb' },
      { name: 'Latin', id: 'latin' },
      { name: 'Jazz', id: 'jazz' }
    ]

    return (
      <div className="min-h-screen bg-black">
        {/* Hero Section - Apple-inspired design */}
        <div className="relative overflow-hidden bg-gradient-to-b from-black via-gray-900/50 to-black">
          {/* Animated background elements */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>
          
          <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
            <div className="text-center space-y-8">
              {/* Tagline */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20">
                <Sparkles className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">The future of live music voting</span>
              </div>
              
              {/* Main heading with gradient */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight">
                <span className="block text-white mb-2">Shape the Show.</span>
                <span className="block bg-gradient-to-r from-white via-gray-300 to-white bg-clip-text text-transparent">
                  Vote the Setlist.
                </span>
              </h1>
              
              {/* Description */}
              <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                Join millions of fans voting on their dream setlists. Your voice shapes what artists play live.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/explore?tab=upcoming"
                  className="group px-6 sm:px-8 py-3 sm:py-4 bg-white text-black rounded-sm font-semibold text-base sm:text-lg hover:bg-gray-100 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  Explore Shows
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-sm text-white font-semibold text-base sm:text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                  <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Watch Demo</span>
                  <span className="sm:hidden">Demo</span>
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mt-16">
              <ClientSearchWrapper 
                placeholder="Search artists or enter your zip code..."
                className="[&_input]:bg-white/10 [&_input]:backdrop-blur-xl [&_input]:border-white/20 [&_input]:text-white [&_input]:placeholder-gray-400 [&_input]:text-base [&_input]:sm:text-lg [&_input]:py-3 [&_input]:sm:py-4 [&_input]:px-4 [&_input]:sm:px-6 [&_input]:rounded-sm [&_input]:focus:ring-4 [&_input]:focus:ring-white/20 [&_input]:focus:border-white/40 [&_svg]:text-white/60 [&_svg]:w-5 [&_svg]:h-5 [&_svg]:left-4 [&_svg]:sm:left-6"
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
          
          {/* Trending Shows Section */}
          <section className="mb-16 sm:mb-32">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-12 gap-4">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 flex items-center gap-3">
                  <div className="p-2 rounded-sm bg-gradient-to-br from-red-500/20 to-orange-500/20 backdrop-blur-xl">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
                  </div>
                  Trending This Week
                </h2>
                <p className="text-gray-400 text-base sm:text-lg">The hottest shows fans are voting on right now</p>
              </div>
              <Link 
                href="/explore?tab=trending"
                className="text-white hover:text-gray-300 transition-colors flex items-center gap-2 group self-start sm:self-auto"
              >
                <span className="text-sm sm:text-base">View all</span>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            {trendingShows && trendingShows.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {trendingShows.slice(0, 12).map((show: HomepageShow) => (
                  <ShowCard 
                    key={show.id} 
                    show={{
                      ...show,
                      title: show.title || show.name || `${show.artist.name} Live`,
                      artist: {
                        ...show.artist,
                        slug: show.artist.slug || '',
                        imageUrl: show.artist.imageUrl
                      }
                    }} 
                    variant="featured" 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-16">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-sm bg-white/5 mb-4 sm:mb-6">
                  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-white/40" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No trending shows yet</h3>
                <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base px-4">Be the first to vote and create buzz around upcoming concerts!</p>
                <Link 
                  href="/explore"
                  className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white text-black rounded-sm font-semibold hover:bg-gray-100 transition-all text-sm sm:text-base"
                >
                  Explore Shows
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </Link>
              </div>
            )}
          </section>

          {/* Featured Artists Section */}
          <section className="mb-16 sm:mb-32">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-12 gap-4">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 flex items-center gap-3">
                  <div className="p-2 rounded-sm bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl">
                    <Star className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                  </div>
                  Featured Artists
                </h2>
                <p className="text-gray-400 text-base sm:text-lg">Top artists with the most active communities</p>
              </div>
              <Link 
                href="/explore?tab=artists"
                className="text-white hover:text-gray-300 transition-colors flex items-center gap-2 group self-start sm:self-auto"
              >
                <span className="text-sm sm:text-base">Browse all artists</span>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            {featuredArtists && featuredArtists.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6">
                {featuredArtists.slice(0, 18).map((artist: HomepageArtist) => (
                  <Link
                    key={artist.id}
                    href={`/artists/${artist.slug}`}
                    className="group"
                  >
                    <div className="relative bg-gradient-to-b from-gray-900/60 to-gray-900/30 backdrop-blur-xl rounded-sm overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-white/10">
                      {/* Artist image */}
                      <div className="aspect-square relative overflow-hidden">
                        {artist.image_url ? (
                          <>
                            <img
                              src={artist.image_url}
                              alt={artist.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
                          </>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                            <Music className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500" />
                          </div>
                        )}
                      </div>
                      
                      {/* Artist info */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                        <h3 className="font-bold text-xs sm:text-sm text-white mb-1 truncate">
                          {artist.name}
                        </h3>
                        <p className="text-xs text-gray-300 mb-2">
                          {Array.isArray(artist.genres) && artist.genres.length > 0 ? artist.genres[0] : 'Music Artist'}
                        </p>
                        <button className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-sm text-white text-xs font-semibold hover:bg-white/20 transition-all flex items-center justify-center gap-1 sm:gap-2">
                          <span className="hidden sm:inline">Vote Now</span>
                          <span className="sm:hidden">Vote</span>
                          <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-16">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-sm bg-white/5 mb-4 sm:mb-6">
                  <Star className="w-6 h-6 sm:w-8 sm:h-8 text-white/40" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No featured artists yet</h3>
                <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base px-4">Artists will appear here as the community grows!</p>
                <Link 
                  href="/explore?tab=artists"
                  className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white text-black rounded-sm font-semibold hover:bg-gray-100 transition-all text-sm sm:text-base"
                >
                  Browse Artists
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </Link>
              </div>
            )}
          </section>

          {/* More Shows Section */}
          {trendingShows && trendingShows.length > 12 && (
            <section className="mb-16 sm:mb-32">
              <div className="flex items-center justify-between mb-8 sm:mb-12">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 flex items-center gap-3">
                    <div className="p-2 rounded-sm bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl">
                      <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                    </div>
                    More Upcoming Shows
                  </h2>
                  <p className="text-gray-400 text-base sm:text-lg">Discover even more concerts to vote on</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {trendingShows.slice(12, 24).map((show: HomepageShow) => (
                  <ShowCard key={show.id} show={show} variant="featured" />
                ))}
              </div>
            </section>
          )}

          {/* Genre Discovery */}
          <section>
            <div className="mb-8 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 flex items-center gap-3">
                <div className="p-2 rounded-sm bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl">
                  <Music className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                </div>
                Explore by Genre
              </h2>
              <p className="text-gray-400 text-base sm:text-lg">Find shows that match your music taste</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {genres.map((genre) => (
                <Link
                  key={genre.id}
                  href={`/search?genre=${genre.id}`}
                  className="group relative"
                >
                  <div className="relative bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-sm p-4 sm:p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-xl hover:shadow-white/5 overflow-hidden">
                    {/* Background gradient */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                    </div>
                    
                    {/* Content */}
                    <div className="relative flex items-center gap-3 sm:gap-4">
                      <div>
                        <h3 className="font-semibold text-white text-sm sm:text-lg group-hover:text-gray-200 transition-colors">
                          {genre.name}
                        </h3>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Call to Action Section */}
        <section className="relative py-16 sm:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] bg-white/5 rounded-full blur-3xl" />
          </div>
          
          <div className="relative w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
              Ready to Shape Live Music?
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 mb-8 sm:mb-10 max-w-2xl mx-auto">
              Join the community that's revolutionizing how artists build their setlists. Your vote matters.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/explore"
                className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-black rounded-sm font-semibold text-base sm:text-lg hover:bg-gray-100 transition-all transform hover:scale-105 flex items-center justify-center gap-2 group"
              >
                Start Voting Now
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/about"
                className="px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-sm text-white font-semibold text-base sm:text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2"
              >
                Learn More
              </Link>
            </div>
          </div>
        </section>
      </div>
    )
  } catch (error) {
    throw error
  }
}

// Server component - data fetched at build time with proper error handling
export default function HomePage() {
  return (
    <ErrorBoundary fallback={HomepageError}>
      <Suspense fallback={<HomepageLoading />}>
        <HomepageContent />
      </Suspense>
    </ErrorBoundary>
  )
}
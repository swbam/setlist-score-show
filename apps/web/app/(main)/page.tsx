import { Suspense } from 'react'
import Link from 'next/link'
import { TrendingUp, Calendar, Users, ArrowRight, Music, Play, Star, ChevronRight, Zap, MapPin, Sparkles } from 'lucide-react'
import { ShowCard } from '@/components/shows/ShowCard'
import { ClientSearchWrapper } from '@/components/homepage/ClientSearchWrapper'
import { getTopHomepageContent, type HomepageShow, type HomepageArtist } from '@/lib/supabase/queries/getTopHomepageContent'
import { ShowCardSkeleton, ArtistCardSkeleton } from '@/components/ui/loading-skeletons'

// Server component - data fetched at build time
export default async function HomePage() {
  const { shows: trendingShows, artists: featuredArtists } = await getTopHomepageContent()

  const loadingTrending = false
  const loadingArtists = false

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
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="block text-white mb-2">Shape the Show.</span>
              <span className="block bg-gradient-to-r from-white via-gray-300 to-white bg-clip-text text-transparent">
                Vote the Setlist.
              </span>
            </h1>
            
            {/* Description */}
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Join millions of fans voting on their dream setlists. Your voice shapes what artists play live.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/explore?tab=upcoming"
                className="group px-8 py-4 bg-white text-black rounded-[2px] font-semibold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
              >
                Explore Shows
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="px-8 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2px] text-white font-semibold text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                <Play className="w-5 h-5" />
                Watch Demo
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mt-16">
            <ClientSearchWrapper 
              placeholder="Search artists or enter your zip code..."
              className="[&_input]:bg-white/10 [&_input]:backdrop-blur-xl [&_input]:border-white/20 [&_input]:text-white [&_input]:placeholder-gray-400 [&_input]:text-lg [&_input]:py-4 [&_input]:px-6 [&_input]:rounded-[2px] [&_input]:focus:ring-4 [&_input]:focus:ring-white/20 [&_input]:focus:border-white/40 [&_svg]:text-white/60 [&_svg]:w-5 [&_svg]:h-5 [&_svg]:left-6"
            />
          </div>

        </div>
      </div>

            {/* Main Content */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        
        {/* Trending Shows Section - Premium card design */}
        <section className="mb-32">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold text-white mb-3 flex items-center gap-3">
                <div className="p-2 rounded-[2px] bg-gradient-to-br from-red-500/20 to-orange-500/20 backdrop-blur-xl">
                  <TrendingUp className="w-6 h-6 text-orange-400" />
                </div>
                Trending This Week
              </h2>
              <p className="text-gray-400 text-lg">The hottest shows fans are voting on right now</p>
            </div>
            <Link 
              href="/explore?tab=trending"
              className="text-white hover:text-gray-300 transition-colors flex items-center gap-2 group"
            >
              View all
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          {loadingTrending ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <ShowCardSkeleton key={i} variant="featured" />
              ))}
            </div>
          ) : trendingShows && trendingShows.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {trendingShows?.slice(0, 12).map((show: HomepageShow) => (
                <ShowCard key={show.id} show={show} variant="featured" />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-[2px] bg-white/5 mb-6">
                <TrendingUp className="w-8 h-8 text-white/40" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No trending shows yet</h3>
              <p className="text-gray-400 mb-6">Be the first to vote and create buzz around upcoming concerts!</p>
              <Link 
                href="/explore"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-[2px] font-semibold hover:bg-gray-100 transition-all"
              >
                Explore Shows
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </section>

        {/* Featured Artists Section - Grid with rich visuals */}
        <section className="mb-32">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold text-white mb-3 flex items-center gap-3">
                <div className="p-2 rounded-[2px] bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl">
                  <Star className="w-6 h-6 text-purple-400" />
                </div>
                Featured Artists
              </h2>
              <p className="text-gray-400 text-lg">Top artists with the most active communities</p>
            </div>
            <Link 
              href="/artists"
              className="text-white hover:text-gray-300 transition-colors flex items-center gap-2 group"
            >
              Browse all artists
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          {loadingArtists ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {Array.from({ length: 18 }).map((_, i) => (
                <ArtistCardSkeleton key={i} />
              ))}
            </div>
          ) : featuredArtists && featuredArtists.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {featuredArtists?.slice(0, 18).map((artist: HomepageArtist) => (
                <Link
                  key={artist.id}
                  href={`/artists/${artist.slug}`}
                  className="group"
                >
                  <div className="relative bg-gradient-to-b from-gray-900/60 to-gray-900/30 backdrop-blur-xl rounded-[2px] overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-white/10">
                    {/* Artist image */}
                    <div className="aspect-square relative overflow-hidden">
                      {artist.image_url ? (
                        <>
                          <img
                            src={artist.image_url}
                            alt={artist.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                          <Music className="w-8 h-8 text-gray-500" />
                        </div>
                      )}
                    </div>
                    
                    {/* Artist info */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="font-bold text-sm text-white mb-1 truncate">
                        {artist.name}
                      </h3>
                      <p className="text-xs text-gray-300 mb-2">
                        {Array.isArray(artist.genres) && artist.genres.length > 0 ? artist.genres[0] : 'Music Artist'}
                      </p>
                      <button className="w-full px-3 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2px] text-white text-xs font-semibold hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                        Vote Now
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-[2px] bg-white/5 mb-6">
                <Star className="w-8 h-8 text-white/40" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No featured artists yet</h3>
              <p className="text-gray-400 mb-6">Artists will appear here as the community grows!</p>
              <Link 
                href="/artists"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-[2px] font-semibold hover:bg-gray-100 transition-all"
              >
                Browse Artists
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </section>

        {/* More Shows Section */}
        {trendingShows && trendingShows.length > 12 && (
          <section className="mb-32">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-4xl font-bold text-white mb-3 flex items-center gap-3">
                  <div className="p-2 rounded-[2px] bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl">
                    <Calendar className="w-6 h-6 text-blue-400" />
                  </div>
                  More Upcoming Shows
                </h2>
                <p className="text-gray-400 text-lg">Discover even more concerts to vote on</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {trendingShows?.slice(12, 24).map((show: HomepageShow) => (
                <ShowCard key={show.id} show={show} variant="featured" />
              ))}
            </div>
          </section>
        )}

        {/* Genre Discovery - Modern pill design */}
        <section>
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-white mb-3 flex items-center gap-3">
              <div className="p-2 rounded-[2px] bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl">
                <Music className="w-6 h-6 text-green-400" />
              </div>
              Explore by Genre
            </h2>
            <p className="text-gray-400 text-lg">Find shows that match your music taste</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {genres.map((genre) => (
              <Link
                key={genre.id}
                href={`/search?genre=${genre.id}`}
                className="group relative"
              >
                <div className="relative bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-[2px] p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-xl hover:shadow-white/5 overflow-hidden">
                  {/* Background gradient */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                  </div>
                  
                  {/* Content */}
                  <div className="relative flex items-center gap-4">
                    <div>
                      <h3 className="font-semibold text-white text-lg group-hover:text-gray-200 transition-colors">
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
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-3xl" />
        </div>
        
        <div className="relative w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-bold text-white mb-6">
            Ready to Shape Live Music?
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join the community that's revolutionizing how artists build their setlists. Your vote matters.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/explore"
              className="px-8 py-4 bg-white text-black rounded-[2px] font-semibold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 flex items-center justify-center gap-2 group"
            >
              Start Voting Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/about"
              className="px-8 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2px] text-white font-semibold text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
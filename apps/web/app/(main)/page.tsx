import Link from 'next/link'
import { ShowCard } from '@/components/shows/ShowCard'
import { UnifiedSearch } from '@/components/search/UnifiedSearch'
import { HeroSection } from '@/components/home/HeroSection'
import { ArtistCard } from '@/components/home/ArtistCard'
import { TrendingUp, Calendar, Users, ArrowRight, Music, MapPin } from 'lucide-react'
import { graphqlClient } from '@/lib/graphql-client'
import { GET_TRENDING_SHOWS, GET_FEATURED_ARTISTS } from '@/lib/graphql/queries'

export default async function HomePage() {
  // Fetch data via GraphQL
  const [showsResult, artistsResult] = await Promise.allSettled([
    graphqlClient.request(GET_TRENDING_SHOWS, { limit: 8 }),
    graphqlClient.request(GET_FEATURED_ARTISTS, { limit: 12 })
  ])

  const topShows = showsResult.status === 'fulfilled' ? showsResult.value.trendingShows : []
  const topArtists = artistsResult.status === 'fulfilled' ? artistsResult.value.featuredArtists : []

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Search */}
      <HeroSection />

      {/* Main Content */}
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-8 sm:py-12 lg:py-16">
        
        {/* Top Artists Section */}
        {topArtists.length > 0 && (
          <section className="mb-12 lg:mb-16">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-primary" />
                <h2 className="text-2xl sm:text-3xl font-headline font-bold gradient-text">
                  Trending Artists
                </h2>
              </div>
              <Link 
                href="/artists"
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
              >
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {topArtists.slice(0, 12).map((artist: any, index: number) => (
                <ArtistCard key={artist.id} artist={artist} index={index} />
              ))}
            </div>
          </section>
        )}

        {/* Top Shows Section */}
        <section className="mb-12 lg:mb-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h2 className="text-2xl sm:text-3xl font-headline font-bold gradient-text">
                Hot Shows This Week
              </h2>
            </div>
            <Link 
              href="/shows"
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {topShows.slice(0, 8).map((show: any) => (
              <ShowCard 
                key={show.id} 
                show={{
                  id: show.id,
                  date: show.date,
                  title: show.title || `${show.artist?.name} at ${show.venue?.name}`,
                  status: show.status || 'upcoming',
                  viewCount: show.view_count || 0,
                  artist: {
                    id: show.artist?.id,
                    name: show.artist?.name || 'Unknown Artist',
                    slug: show.artist?.slug || '',
                    imageUrl: show.artist?.imageUrl
                  },
                  venue: {
                    id: show.venue?.id,
                    name: show.venue?.name || 'Unknown Venue',
                    city: show.venue?.city || 'Unknown City',
                    state: show.venue?.state,
                    country: show.venue?.country || 'Unknown Country'
                  },
                  _count: { votes: show.totalVotes || 0 }
                }} 
              />
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-headline font-bold gradient-text mb-6">
            Explore More
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Link
              href="/explore"
              className="group p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 transition-all duration-200 hover:shadow-lg"
            >
              <TrendingUp className="w-8 h-8 text-primary mb-3" />
              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                Trending Shows
              </h3>
              <p className="text-muted-foreground text-sm">
                Discover the hottest shows based on fan engagement
              </p>
            </Link>

            <Link
              href="/explore"
              className="group p-6 rounded-xl bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20 hover:border-secondary/40 transition-all duration-200 hover:shadow-lg"
            >
              <Calendar className="w-8 h-8 text-secondary mb-3" />
              <h3 className="text-lg font-semibold mb-2 group-hover:text-secondary transition-colors">
                Upcoming Concerts
              </h3>
              <p className="text-muted-foreground text-sm">
                Browse all upcoming shows and start voting
              </p>
            </Link>

            <div className="group p-6 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 hover:border-accent/40 transition-all duration-200 hover:shadow-lg">
              <MapPin className="w-8 h-8 text-accent mb-3" />
              <h3 className="text-lg font-semibold mb-2 group-hover:text-accent transition-colors">
                Find Shows Near You
              </h3>
              <p className="text-muted-foreground text-sm mb-3">
                Enter your ZIP code in the search bar above
              </p>
              <p className="text-xs text-muted-foreground/70">
                Discover concerts within 100 miles
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
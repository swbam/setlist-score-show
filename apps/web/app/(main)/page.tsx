import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { HeroSection } from '@/components/home/HeroSection'
import { ArtistCard } from '@/components/home/ArtistCard'
import { ShowCard } from '@/components/shows/ShowCard'
import { Card } from '@/components/ui/card'
import { Suspense } from 'react'

// Loading components
function ArtistsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-square bg-gray-200 rounded-lg mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      ))}
    </div>
  )
}

function ShowsSkeleton() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-video bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-5 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  )
}

export default async function HomePage() {
  const supabase = createServerComponentClient({ cookies })

  try {
    // Enhanced data fetching with fallbacks
    const [artistsResult, showsResult, statsResult] = await Promise.all([
      // Get trending artists with comprehensive data
      supabase.rpc('get_trending_artists', { p_limit: 24 }).then(result => {
        if (result.error) {
          console.error('Error fetching trending artists:', result.error)
          // Fallback to direct query
          return supabase
            .from('artists')
            .select(`
              id,
              name,
              slug,
              image_url,
              genres,
              popularity,
              shows!inner(id, date, status)
            `)
            .eq('shows.status', 'upcoming')
            .gte('shows.date', new Date().toISOString())
            .order('popularity', { ascending: false })
            .limit(24)
        }
        return result
      }),

      // Get top shows with venue and artist data
      supabase.rpc('get_top_shows', { p_limit: 20 }).then(result => {
        if (result.error) {
          console.error('Error fetching top shows:', result.error)
          // Fallback to direct query
          return supabase
            .from('shows')
            .select(`
              id,
              name,
              date,
              status,
              tickets_url,
              min_price,
              max_price,
              artist:artists(id, name, slug, image_url),
              venue:venues(id, name, city, state, capacity)
            `)
            .eq('status', 'upcoming')
            .gte('date', new Date().toISOString())
            .order('popularity', { ascending: false })
            .limit(20)
        }
        return result
      }),

      // Get platform stats
      Promise.all([
        supabase.from('artists').select('*', { count: 'exact', head: true }),
        supabase.from('shows').select('*', { count: 'exact', head: true }).eq('status', 'upcoming').gte('date', new Date().toISOString()),
        supabase.from('venues').select('*', { count: 'exact', head: true }),
        supabase.from('votes').select('*', { count: 'exact', head: true })
      ])
    ])

    // Process and normalize the data
    const topArtists = (artistsResult.data || []).map(artist => ({
      id: artist.id,
      name: artist.name,
      slug: artist.slug,
      imageUrl: artist.image_url,
      genres: artist.genres || [],
      popularity: artist.popularity || 0,
      upcomingShowsCount: artist.upcoming_shows_count || 0,
      totalVotes: artist.total_votes || 0,
      nextShowDate: artist.next_show_date
    }))

    const topShows = (showsResult.data || []).map(show => ({
      id: show.id,
      title: show.title || show.name,
      date: show.date,
      status: 'upcoming',
      tickets_url: show.tickets_url,
      min_price: show.min_price,
      max_price: show.max_price,
      artist: show.artist,
      venue: show.venue,
      totalVotes: show.total_votes || 0
    }))

    // If still no data, trigger sync (development helper)
    if (topArtists.length === 0 && topShows.length === 0) {
      try {
        console.log('No data found, attempting to trigger sync...')
        // This would typically be handled by cron jobs in production
        await fetch('/api/cron/sync-top-shows', { method: 'POST' })
      } catch (error) {
        console.log('Could not trigger sync:', error)
      }
    }

    const [artistCount, showCount, venueCount, voteCount] = statsResult
    const stats = {
      artists: artistCount.count || 0,
      shows: showCount.count || 0,
      venues: venueCount.count || 0,
      votes: voteCount.count || 0
    }

    return (
      <main className="min-h-screen bg-background">
        <HeroSection />
        
        {/* Stats Section */}
        <section className="py-8 bg-background border-b border-border">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 text-center bg-card border-border">
                <div className="text-2xl font-bold text-foreground">{stats.artists}</div>
                <div className="text-sm text-muted-foreground">Artists</div>
              </Card>
              <Card className="p-4 text-center bg-card border-border">
                <div className="text-2xl font-bold text-foreground">{stats.shows}</div>
                <div className="text-sm text-muted-foreground">Upcoming Shows</div>
              </Card>
              <Card className="p-4 text-center bg-card border-border">
                <div className="text-2xl font-bold text-foreground">{stats.venues}</div>
                <div className="text-sm text-muted-foreground">Venues</div>
              </Card>
              <Card className="p-4 text-center bg-card border-border">
                <div className="text-2xl font-bold text-foreground">{stats.votes}</div>
                <div className="text-sm text-muted-foreground">Total Votes</div>
              </Card>
            </div>
          </div>
        </section>

        {/* Trending Artists Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-headline font-bold gradient-text">Trending Artists</h2>
                <p className="text-muted-foreground mt-2">Artists with the most upcoming shows and votes</p>
              </div>
              <a 
                href="/explore?tab=artists" 
                className="text-sm text-primary hover:text-primary/80 font-medium"
              >
                View All →
              </a>
            </div>
            
            <Suspense fallback={<ArtistsSkeleton />}>
              {topArtists.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    🎵
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No artists found</h3>
                  <p className="text-muted-foreground">Data is being synced. Check back soon!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {topArtists.slice(0, 12).map((artist) => (
                    <ArtistCard key={artist.id} artist={artist} />
                  ))}
                </div>
              )}
            </Suspense>
          </div>
        </section>

        {/* Upcoming Shows Section */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900/50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-headline font-bold gradient-text">Hot Shows This Week</h2>
                <p className="text-muted-foreground mt-2">Most anticipated concerts with active voting</p>
              </div>
              <a 
                href="/explore?tab=shows" 
                className="text-sm text-primary hover:text-primary/80 font-medium"
              >
                View All →
              </a>
            </div>
            
            <Suspense fallback={<ShowsSkeleton />}>
              {topShows.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    🎤
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No shows found</h3>
                  <p className="text-muted-foreground">Concert data is being populated. Check back soon!</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {topShows.slice(0, 9).map((show) => (
                    <ShowCard key={show.id} show={show} />
                  ))}
                </div>
              )}
            </Suspense>
          </div>
        </section>

        {/* Quick Actions Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-headline font-bold text-center mb-8">Discover More</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <a 
                href="/search" 
                className="group p-6 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl border border-teal-200 dark:border-teal-800 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  🔍
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Search Artists</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Find your favorite artists and upcoming shows</p>
              </a>
              
              <a 
                href="/nearby/10001" 
                className="group p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  📍
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Shows Near You</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Enter your ZIP code to find local concerts</p>
              </a>
              
              <a 
                href="/trending" 
                className="group p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl border border-orange-200 dark:border-orange-800 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  🔥
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Trending Now</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">See what's hot in the music world</p>
              </a>
            </div>
          </div>
        </section>
      </main>
    )
  } catch (error) {
    console.error('Homepage error:', error)
    return (
      <main className="min-h-screen bg-background">
        <HeroSection />
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="text-2xl font-headline font-bold gradient-text mb-4">
                Welcome to TheSet
              </h2>
              <p className="text-muted-foreground">
                The platform is being populated with fresh data. Check back soon!
              </p>
            </div>
          </div>
        </section>
      </main>
    )
  }
}
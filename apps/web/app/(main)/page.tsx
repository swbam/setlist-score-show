import { createClient } from '@supabase/supabase-js'
import { HeroSection } from '@/components/home/HeroSection'
import { ArtistCard } from '@/components/home/ArtistCard'
import { ShowCard } from '@/components/shows/ShowCard'
import { Card } from '@/components/ui/card'
import { Suspense } from 'react'

// This page uses dynamic data and should not be statically generated
export const dynamic = 'force-dynamic'
export const revalidate = 0

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
  // Use createClient for public data access - no authentication needed
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    // Get trending artists - simplified query
    const { data: topArtistsData, error: artistsError } = await supabase
      .from('artists')
      .select(`
        id,
        name,
        slug,
        image_url,
        genres,
        popularity,
        followers
      `)
      .not('image_url', 'is', null)
      .order('popularity', { ascending: false })
      .limit(24)

    if (artistsError) {
      console.error('Error fetching artists:', artistsError)
    }

    // Get count of shows for each artist separately to avoid complex joins
    const artistsWithShows = await Promise.all(
      (topArtistsData || []).map(async (artist) => {
        const { count } = await supabase
          .from('shows')
          .select('*', { count: 'exact', head: true })
          .eq('artist_id', artist.id)
          .eq('status', 'upcoming')
          .gte('date', new Date().toISOString().split('T')[0])

        return {
          id: artist.id,
          name: artist.name,
          slug: artist.slug,
          image_url: artist.image_url,
          genres: artist.genres || [],
          popularity: artist.popularity || 0,
          followers: artist.followers || 0,
          upcoming_shows_count: count || 0
        }
      })
    )

    // Get top upcoming shows - simplified
    const { data: showsData, error: showsError } = await supabase
      .from('shows')
      .select(`
        id,
        title,
        date,
        status,
        ticketmaster_url,
        min_price,
        max_price,
        artist_id,
        venue_id
      `)
      .eq('status', 'upcoming')
      .gte('date', new Date().toISOString().split('T')[0])
      .not('title', 'ilike', '%kidz%')
      .not('title', 'ilike', '%thomas%')
      .not('title', 'ilike', '%children%')
      .not('title', 'ilike', '%rocky horror%')
      .order('date', { ascending: true })
      .limit(20)

    if (showsError) {
      console.error('Error fetching shows:', showsError)
    }

    // Get artists and venues for shows
    const artistIds = [...new Set(showsData?.map(show => show.artist_id) || [])]
    const venueIds = [...new Set(showsData?.map(show => show.venue_id) || [])]

    const [artistsForShows, venuesForShows] = await Promise.all([
      supabase.from('artists').select('id, name, slug, image_url').in('id', artistIds),
      supabase.from('venues').select('id, name, city, state, capacity').in('id', venueIds)
    ])

    // Create lookup maps
    const artistMap = new Map(artistsForShows.data?.map(a => [a.id, a]) || [])
    const venueMap = new Map(venuesForShows.data?.map(v => [v.id, v]) || [])

    // Process shows with artist and venue data
    const topShows = (showsData || []).map(show => ({
      id: show.id,
      title: show.title,
      date: show.date,
      status: 'upcoming',
      ticketmaster_url: show.ticketmaster_url,
      min_price: show.min_price,
      max_price: show.max_price,
      artist: artistMap.get(show.artist_id),
      venue: venueMap.get(show.venue_id),
      totalVotes: 0 // We'll calculate this later if needed
    })).filter(show => show.artist && show.venue) // Only include shows with complete data

    // Get platform stats
    const [artistCountResult, showCountResult, venueCountResult, voteCountResult] = await Promise.all([
      supabase.from('artists').select('*', { count: 'exact', head: true }),
      supabase.from('shows').select('*', { count: 'exact', head: true }).eq('status', 'upcoming').gte('date', new Date().toISOString().split('T')[0]),
      supabase.from('venues').select('*', { count: 'exact', head: true }),
      supabase.from('votes').select('*', { count: 'exact', head: true })
    ])

    const stats = {
      artists: artistCountResult.count || 0,
      shows: showCountResult.count || 0,
      venues: venueCountResult.count || 0,
      votes: voteCountResult.count || 0
    }

    console.log('📊 Homepage stats:', stats)
    console.log('🎤 Top artists count:', artistsWithShows.length)
    console.log('🎪 Top shows count:', topShows.length)

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
              {artistsWithShows.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {artistsWithShows.map((artist) => (
                    <ArtistCard
                      key={artist.id}
                      artist={artist}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No artists found</p>
                </div>
              )}
            </Suspense>
          </div>
        </section>

        {/* Hot Shows Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-headline font-bold gradient-text">Hot Shows This Week</h2>
                <p className="text-muted-foreground mt-2">Upcoming concerts with the most buzz</p>
              </div>
              <a 
                href="/explore?tab=shows" 
                className="text-sm text-primary hover:text-primary/80 font-medium"
              >
                View All →
              </a>
            </div>

            <Suspense fallback={<ShowsSkeleton />}>
              {topShows.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {topShows.map((show) => (
                    <ShowCard
                      key={show.id}
                      show={show}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No shows found</p>
                </div>
              )}
            </Suspense>
          </div>
        </section>
      </main>
    )
  } catch (error) {
    console.error('Homepage error:', error)
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-muted-foreground">Unable to load the homepage. Please try again later.</p>
        </div>
      </main>
    )
  }
}
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { HeroSection } from '@/components/home/HeroSection'
import { ArtistCard } from '@/components/home/ArtistCard'
import { ShowCard } from '@/components/shows/ShowCard'
import { Card } from '@/components/ui/card'

export default async function HomePage() {
  const supabase = createServerComponentClient({ cookies })

  try {
    // Query main tables directly - no cache needed
    const [artistsResult, showsResult, statsResult] = await Promise.all([
      // Get top artists by popularity
      supabase
        .from('artists')
        .select('id, name, slug, image_url, genres, popularity')
        .order('popularity', { ascending: false })
        .limit(9),

      // Get upcoming shows - use separate queries to avoid join issues
      supabase
        .from('shows')
        .select('id, title, date, status, ticketmaster_url, min_price, max_price, artist_id, venue_id')
        .eq('status', 'upcoming')
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(12),

      // Get basic stats for the dashboard
      Promise.all([
        supabase.from('artists').select('*', { count: 'exact', head: true }),
        supabase.from('shows').select('*', { count: 'exact', head: true }).eq('status', 'upcoming').gte('date', new Date().toISOString()),
        supabase.from('venues').select('*', { count: 'exact', head: true }),
        supabase.from('votes').select('*', { count: 'exact', head: true })
      ])
    ])

    const topArtists = artistsResult.data || []
    const rawShows = showsResult.data || []

    // Get artist and venue data for shows separately
    const artistIds = [...new Set(rawShows.map(show => show.artist_id))]
    const venueIds = [...new Set(rawShows.map(show => show.venue_id))]

    const [artistsForShows, venuesForShows] = await Promise.all([
      artistIds.length > 0 ? supabase
        .from('artists')
        .select('id, name, slug, image_url')
        .in('id', artistIds) : { data: [] },
      venueIds.length > 0 ? supabase
        .from('venues')
        .select('id, name, city, state, capacity')
        .in('id', venueIds) : { data: [] }
    ])

    // Create lookup maps
    const artistMap = new Map((artistsForShows.data || []).map(a => [a.id, a]))
    const venueMap = new Map((venuesForShows.data || []).map(v => [v.id, v]))

    // Transform shows data to match ShowCard interface
    const topShows = rawShows.map(show => ({
      ...show,
      artist: artistMap.get(show.artist_id) || { id: show.artist_id, name: 'Unknown Artist', slug: 'unknown', image_url: null },
      venue: venueMap.get(show.venue_id) || { id: show.venue_id, name: 'Unknown Venue', city: 'Unknown', state: '', capacity: null }
    }))

    const [artistCount, showCount, venueCount, voteCount] = statsResult
    const stats = {
      artists: artistCount.count || 0,
      shows: showCount.count || 0,
      venues: venueCount.count || 0,
      votes: voteCount.count || 0
    }

    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <HeroSection />
        
        {/* Stats Section */}
        <section className="py-8 bg-gray-900 border-b border-gray-700">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 text-center bg-gray-800 border-gray-700">
                <div className="text-2xl font-bold text-white">{stats.artists}</div>
                <div className="text-sm text-gray-400">Artists</div>
              </Card>
              <Card className="p-4 text-center bg-gray-800 border-gray-700">
                <div className="text-2xl font-bold text-white">{stats.shows}</div>
                <div className="text-sm text-gray-400">Upcoming Shows</div>
              </Card>
              <Card className="p-4 text-center bg-gray-800 border-gray-700">
                <div className="text-2xl font-bold text-white">{stats.venues}</div>
                <div className="text-sm text-gray-400">Venues</div>
              </Card>
              <Card className="p-4 text-center bg-gray-800 border-gray-700">
                <div className="text-2xl font-bold text-white">{stats.votes}</div>
                <div className="text-sm text-gray-400">Total Votes</div>
              </Card>
            </div>
          </div>
        </section>

        {/* Trending Artists Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Trending Artists</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {topArtists.map((artist) => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </div>
          </div>
        </section>

        {/* Upcoming Shows Section */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900/50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Upcoming Shows</h2>
            </div>
            {topShows.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">No upcoming shows found. Check back soon!</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topShows.map((show) => (
                  <ShowCard key={show.id} show={show} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    )
  } catch (error) {
    console.error('Homepage error:', error)
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <HeroSection />
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome to TheSet
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                The platform is being populated with fresh data. Check back soon!
              </p>
            </div>
          </div>
        </section>
      </main>
    )
  }
}
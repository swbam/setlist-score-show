import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { HeroSection } from '@/components/home/HeroSection'
import { ArtistCard } from '@/components/home/ArtistCard'
import { ShowCard } from '@/components/shows/ShowCard'
import { Card } from '@/components/ui/card'

export default async function HomePage() {
  const supabase = createServerComponentClient({ cookies })

  try {
    // Use RPC functions for better performance and data structure
    const [artistsResult, showsResult, statsResult] = await Promise.all([
      // Get trending artists with show counts using RPC function
      supabase.rpc('get_trending_artists', { p_limit: 12 }),

      // Get top shows with engagement data using RPC function
      supabase.rpc('get_top_shows', { p_limit: 12 }),

      // Get basic stats for the dashboard
      Promise.all([
        supabase.from('artists').select('*', { count: 'exact', head: true }),
        supabase.from('shows').select('*', { count: 'exact', head: true }).eq('status', 'upcoming').gte('date', new Date().toISOString()),
        supabase.from('venues').select('*', { count: 'exact', head: true }),
        supabase.from('votes').select('*', { count: 'exact', head: true })
      ])
    ])

    // If no data from RPC functions, populate sample data (for development)
    if ((!artistsResult.data || artistsResult.data.length === 0) && 
        (!showsResult.data || showsResult.data.length === 0)) {
      try {
        const populateResult = await supabase.rpc('populate_sample_data')
        console.log('Sample data populated:', populateResult.data)
        
        // Retry getting data after population
        const [retryArtists, retryShows] = await Promise.all([
          supabase.rpc('get_trending_artists', { p_limit: 12 }),
          supabase.rpc('get_top_shows', { p_limit: 12 })
        ])
        
        artistsResult.data = retryArtists.data
        showsResult.data = retryShows.data
      } catch (populateError) {
        console.log('Could not populate sample data:', populateError)
      }
    }

    const topArtists = artistsResult.data || []
    const topShows = (showsResult.data || []).map(show => ({
      id: show.id,
      title: show.title,
      date: show.date,
      status: 'upcoming',
      ticketmaster_url: show.ticketmaster_url,
      tickets_url: show.tickets_url,
      min_price: show.min_price,
      max_price: show.max_price,
      artist: show.artist,
      venue: show.venue,
      totalVotes: show.total_votes || 0
    }))

    const [artistCount, showCount, venueCount, voteCount] = statsResult
    const stats = {
      artists: artistCount.count || 0,
      shows: showCount.count || 0,
      venues: venueCount.count || 0,
      votes: voteCount.count || 0
    }

    return (
      <main className="min-h-screen bg-gray-900">
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
        <section className="py-16 bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-white">Trending Artists</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {topArtists.map((artist) => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </div>
          </div>
        </section>

        {/* Upcoming Shows Section */}
        <section className="py-16 bg-black border-t border-gray-800">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-white">Upcoming Shows</h2>
            </div>
            {topShows.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">No upcoming shows found. Check back soon!</p>
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
      <main className="min-h-screen bg-gray-900">
        <HeroSection />
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                Welcome to TheSet
              </h2>
              <p className="text-gray-400">
                The platform is being populated with fresh data. Check back soon!
              </p>
            </div>
          </div>
        </section>
      </main>
    )
  }
}
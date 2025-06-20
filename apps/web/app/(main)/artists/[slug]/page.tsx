import { Calendar, MapPin, Users, Music, ExternalLink, Heart, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { notFound } from 'next/navigation'
import { ShowCard } from '@/components/shows/ShowCard'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export default async function ArtistPage({ params }: { params: { slug: string } }) {
  const supabase = createServerComponentClient({ cookies })

  try {
    // Get artist data
    const { data: artistData, error: artistError } = await supabase
      .from('artists')
      .select('*')
      .eq('slug', params.slug)
      .single()

    if (artistError || !artistData) {
      console.error('Error fetching artist:', artistError)
      notFound()
    }

    // Get shows for this artist with separate venue query
    const { data: showsData } = await supabase
      .from('shows')
      .select('id, title, date, status, ticketmaster_url, min_price, max_price, venue_id')
      .eq('artist_id', artistData.id)
      .order('date', { ascending: true })

    // Get venue data for shows
    const venueIds = [...new Set(showsData?.map(s => s.venue_id) || [])]
    const { data: venuesData } = venueIds.length > 0 
      ? await supabase
          .from('venues')
          .select('id, name, city, state, country, capacity')
          .in('id', venueIds)
      : { data: [] }
    
    const venueMap = new Map(venuesData?.map(v => [v.id, v]) || [])

    const shows = showsData || []
    const now = new Date()
    const upcomingShows = shows.filter(show => new Date(show.date) > now)
    const pastShows = shows.filter(show => new Date(show.date) <= now).slice(0, 10)

    return (
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="relative bg-black text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black to-gray-900" />
          
          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              {/* Artist Image */}
              <div className="flex-shrink-0">
                {artistData.image_url ? (
                  <img
                    src={artistData.image_url}
                    alt={artistData.name}
                    className="w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 rounded-full object-cover shadow-2xl border-4 border-white/20"
                  />
                ) : (
                  <div className="w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 rounded-full bg-gray-800 flex items-center justify-center shadow-2xl border-4 border-white/20">
                    <Music className="w-20 h-20 text-white/60" />
                  </div>
                )}
              </div>
              
              {/* Artist Info */}
              <div className="flex-1 text-center lg:text-left">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-headline font-bold mb-4 text-white">
                  {artistData.name}
                </h1>
                
                {/* Genres */}
                {artistData.genres?.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-6">
                    {artistData.genres.slice(0, 4).map((genre: string) => (
                      <span 
                        key={genre}
                        className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium border border-white/20"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Stats */}
                <div className="flex flex-wrap gap-6 justify-center lg:justify-start mb-8 text-white/90">
                  {artistData.followers && (
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      <span className="font-medium">
                        {artistData.followers.toLocaleString()} followers
                      </span>
                    </div>
                  )}
                  {artistData.popularity && (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      <span className="font-medium">
                        {artistData.popularity}% popularity
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <span className="font-medium">
                      {upcomingShows.length} upcoming shows
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                  {artistData.spotify_id && (
                    <Link
                      href={`https://open.spotify.com/artist/${artistData.spotify_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#1DB954] hover:bg-[#1aa34a] text-white rounded-lg font-semibold transition-colors"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                      </svg>
                      Listen on Spotify
                    </Link>
                  )}
                  <button className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold transition-colors border border-white/20">
                    <Heart className="w-5 h-5" />
                    Follow Artist
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Shows Tabs */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 sm:mb-8">
              <TabsTrigger value="upcoming" className="text-sm sm:text-base">
                Upcoming Shows ({upcomingShows.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="text-sm sm:text-base">
                Recent Shows ({pastShows.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingShows.length > 0 ? (
                <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingShows.map((show: any) => {
                    const venue = venueMap.get(show.venue_id)
                    
                    return (
                      <ShowCard 
                        key={show.id} 
                        show={{
                          id: show.id,
                          date: show.date,
                          title: show.title || `${artistData.name} at ${venue?.name || 'Unknown Venue'}`,
                          status: show.status || 'upcoming',
                          ticketmaster_url: show.ticketmaster_url,
                          min_price: show.min_price,
                          max_price: show.max_price,
                          artist: {
                            id: artistData.id,
                            name: artistData.name,
                            slug: artistData.slug,
                            image_url: artistData.image_url
                          },
                          venue: {
                            id: venue?.id || show.venue_id,
                            name: venue?.name || 'Unknown Venue',
                            city: venue?.city || 'Unknown City',
                            state: venue?.state || '',
                            capacity: venue?.capacity
                          },
                          totalVotes: 0
                        }} 
                      />
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No upcoming shows</h3>
                  <p className="text-muted-foreground">
                    Check back later for new tour dates!
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {pastShows.length > 0 ? (
                <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {pastShows.map((show: any) => {
                    const venue = venueMap.get(show.venue_id)
                    
                    return (
                      <ShowCard 
                        key={show.id} 
                        show={{
                          id: show.id,
                          date: show.date,
                          title: show.title || `${artistData.name} at ${venue?.name || 'Unknown Venue'}`,
                          status: show.status || 'completed',
                          ticketmaster_url: show.ticketmaster_url,
                          min_price: show.min_price,
                          max_price: show.max_price,
                          artist: {
                            id: artistData.id,
                            name: artistData.name,
                            slug: artistData.slug,
                            image_url: artistData.image_url
                          },
                          venue: {
                            id: venue?.id || show.venue_id,
                            name: venue?.name || 'Unknown Venue',
                            city: venue?.city || 'Unknown City',
                            state: venue?.state || '',
                            capacity: venue?.capacity
                          },
                          totalVotes: 0
                        }} 
                      />
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No recent shows</h3>
                  <p className="text-muted-foreground">
                    This artist hasn't performed recently.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    )

  } catch (error) {
    console.error('Error in artist page:', error)
    notFound()
  }
}
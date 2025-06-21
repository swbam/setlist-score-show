import { notFound } from 'next/navigation'
import { Calendar, MapPin, ExternalLink, Music, Users, Star } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { ShowCard } from '@/components/shows/ShowCard'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// This page uses dynamic data and should not be statically generated
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface ArtistPageProps {
  params: {
    slug: string
  }
}

export default async function ArtistPage({ params }: ArtistPageProps) {
  // Use createClient for public data access - no authentication needed
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    // Get artist data
    const { data: artist, error: artistError } = await supabase
      .from('artists')
      .select('*')
      .eq('slug', params.slug)
      .single()

    if (artistError || !artist) {
      console.error('Error fetching artist:', artistError)
      notFound()
    }

    // Get artist's upcoming shows
    const { data: upcomingShows, error: upcomingError } = await supabase
      .from('shows')
      .select(`
        id,
        title,
        date,
        start_time,
        status,
        ticketmaster_url,
        venue_id
      `)
      .eq('artist_id', artist.id)
      .eq('status', 'upcoming')
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })

    if (upcomingError) {
      console.error('Error fetching upcoming shows:', upcomingError)
    }

    // Get venues for upcoming shows
    let upcomingVenues: any[] = []
    if (upcomingShows && upcomingShows.length > 0) {
      const venueIds = upcomingShows.map(show => show.venue_id)
      const { data: venues } = await supabase
        .from('venues')
        .select('id, name, city, state, capacity')
        .in('id', venueIds)
      upcomingVenues = venues || []
    }

    // Get artist's recent/past shows for the "Recent Shows" tab
    const { data: recentShows, error: recentError } = await supabase
      .from('shows')
      .select(`
        id,
        title,
        date,
        start_time,
        status,
        venue_id
      `)
      .eq('artist_id', artist.id)
      .lt('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: false })
      .limit(10)

    if (recentError) {
      console.error('Error fetching recent shows:', recentError)
    }

    // Get venues for recent shows
    let recentVenues: any[] = []
    if (recentShows && recentShows.length > 0) {
      const venueIds = recentShows.map(show => show.venue_id)
      const { data: venues } = await supabase
        .from('venues')
        .select('id, name, city, state, capacity')
        .in('id', venueIds)
      recentVenues = venues || []
    }

    // Process shows data with venue lookup
    const upcomingShowsData = (upcomingShows || []).map(show => {
      const venue = upcomingVenues.find(v => v.id === show.venue_id)
      return {
        id: show.id,
        title: show.title,
        date: show.date,
        startTime: show.start_time,
        status: show.status,
        ticketmaster_url: show.ticketmaster_url,
        artist: {
          id: artist.id,
          name: artist.name,
          slug: artist.slug,
          image_url: artist.image_url
        },
        venue: venue || { id: show.venue_id, name: 'Unknown Venue', city: '', state: '', capacity: null },
        totalVotes: 0
      }
    })

    const recentShowsData = (recentShows || []).map(show => {
      const venue = recentVenues.find(v => v.id === show.venue_id)
      return {
        id: show.id,
        title: show.title,
        date: show.date,
        startTime: show.start_time,
        status: show.status,
        artist: {
          id: artist.id,
          name: artist.name,
          slug: artist.slug,
          image_url: artist.image_url
        },
        venue: venue || { id: show.venue_id, name: 'Unknown Venue', city: '', state: '', capacity: null },
        totalVotes: 0
      }
    })

    return (
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            {artist.image_url ? (
              <div 
                className="w-full h-full bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${artist.image_url})` }}
              >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
            )}
          </div>

          {/* Content */}
          <div className="relative z-10 pt-24 pb-16">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl">
                {/* Artist Info */}
                <div className="mb-8">
                  <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                    {artist.name}
                  </h1>
                  {artist.genres && artist.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {artist.genres.slice(0, 3).map((genre, index) => (
                        <Badge key={index} variant="secondary">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <Users className="w-5 h-5 text-white" />
                        <span className="text-white font-medium">Followers</span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {artist.followers?.toLocaleString() || 'N/A'}
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <Star className="w-5 h-5 text-white" />
                        <span className="text-white font-medium">Popularity</span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {artist.popularity}%
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-5 h-5 text-white" />
                        <span className="text-white font-medium">Upcoming Shows</span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {upcomingShowsData.length}
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4">
                  {artist.spotify_id && (
                    <Button asChild size="lg" variant="secondary">
                      <a 
                        href={`https://open.spotify.com/artist/${artist.spotify_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <span>🎵</span>
                        Listen on Spotify
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Shows Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              
              {/* Upcoming Shows */}
              <div className="mb-16">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-headline font-bold gradient-text">
                    Upcoming Shows ({upcomingShowsData.length})
                  </h2>
                </div>

                {upcomingShowsData.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcomingShowsData.map((show) => (
                      <ShowCard key={show.id} show={show} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted/50 rounded-xl">
                    <Calendar className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Upcoming Shows</h3>
                    <p className="text-muted-foreground">
                      Check back later for new tour announcements
                    </p>
                  </div>
                )}
              </div>

              {/* Recent Shows */}
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-headline font-bold gradient-text">
                    Recent Shows ({recentShowsData.length})
                  </h2>
                </div>

                {recentShowsData.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recentShowsData.map((show) => (
                      <ShowCard key={show.id} show={show} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted/50 rounded-xl">
                    <Music className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Recent Shows</h3>
                    <p className="text-muted-foreground">
                      No past shows found in our database
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    )
  } catch (error) {
    console.error('Artist page error:', error)
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Artist Not Found</h1>
          <p className="text-muted-foreground">Unable to load this artist. Please try again later.</p>
        </div>
      </main>
    )
  }
}
import { notFound } from 'next/navigation'
import { Music, Calendar, MapPin, Users, ExternalLink, Star } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { VotingSection } from '@/components/voting/VotingSection'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// This page uses dynamic data and should not be statically generated
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface ShowPageProps {
  params: {
    id: string
  }
}

export default async function ShowPage({ params }: ShowPageProps) {
  // Use createClient for public data access - no authentication needed for viewing
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    // Get show data with correct field names
    const { data: show, error: showError } = await supabase
      .from('shows')
      .select(`
        id,
        title,
        date,
        start_time,
        doors_time,
        status,
        ticketmaster_url,
        tour_name,
        view_count,
        artist_id,
        venue_id
      `)
      .eq('id', params.id)
      .single()

    if (showError || !show) {
      console.error('Error fetching show:', showError)
      return (
        <main className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Show Not Found</h1>
            <p className="text-muted-foreground">Unable to load this show. Please try again later.</p>
          </div>
        </main>
      )
    }

    // Get artist and venue data
    const [artistResult, venueResult] = await Promise.all([
      supabase.from('artists').select('*').eq('id', show.artist_id).single(),
      supabase.from('venues').select('*').eq('id', show.venue_id).single()
    ])

    if (artistResult.error || venueResult.error || !artistResult.data || !venueResult.data) {
      console.error('Error fetching artist/venue:', artistResult.error, venueResult.error)
      return (
        <main className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Show Not Found</h1>
            <p className="text-muted-foreground">Unable to load artist or venue data.</p>
          </div>
        </main>
      )
    }

    const artist = artistResult.data
    const venue = venueResult.data

    // Get setlist data using RPC function
    const { data: setlistData, error: setlistError } = await supabase
      .rpc('get_show_setlist_with_songs', { show_id: params.id })

    console.log('Setlist RPC result:', { count: setlistData?.length, error: setlistError })

    let setlistSongs: any[] = []
    
    if (setlistData && !setlistError && setlistData.length > 0) {
      setlistSongs = setlistData.map((item: any) => ({
        id: item.setlist_song_id,
        position: item.song_position,
        votes: item.vote_count || 0,
        hasVoted: false, // Will be determined client-side
        canVote: true,
        song: {
          id: item.song_id,
          name: item.song_title,
          album: item.song_album,
          duration: item.song_duration_ms,
          popularity: item.song_popularity,
          spotifyUrl: item.song_spotify_id ? `https://open.spotify.com/track/${item.song_spotify_id}` : null,
          previewUrl: null
        }
      }))
      
      console.log('Final processed setlist songs:', { count: setlistSongs.length })
    }

    // Calculate total votes across all setlist songs
    const totalVotes = setlistSongs.reduce((sum, song) => sum + (song.votes || 0), 0)

    // Get venue capacity display
    const capacityDisplay = venue.capacity 
      ? venue.capacity.toLocaleString() 
      : 'Capacity not available'

    // Build complete show object with correct fields
    const showData = {
      id: show.id,
      title: show.title,
      date: show.date,
      startTime: show.start_time,
      doorsTime: show.doors_time,
      status: show.status,
      ticketmaster_url: show.ticketmaster_url,
      tourName: show.tour_name,
      viewCount: show.view_count,
      artist,
      venue,
      totalVotes,
      songsCount: setlistSongs.length
    }

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
                {/* Artist Name */}
                <div className="mb-4">
                  <Badge variant="secondary" className="mb-2">
                    {new Date(show.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Badge>
                  <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">
                    {artist.name}
                  </h1>
                  <h2 className="text-xl md:text-2xl text-white/90 mb-4">
                    {show.title}
                  </h2>
                </div>

                {/* Show Details */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <MapPin className="w-5 h-5 text-white" />
                        <span className="text-white font-medium">Venue Details</span>
                      </div>
                      <div className="space-y-2 text-white/90">
                        <p className="font-semibold">{venue.name}</p>
                        <p>{venue.city}, {venue.state}</p>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{capacityDisplay}</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Star className="w-5 h-5 text-white" />
                        <span className="text-white font-medium">Voting Stats</span>
                      </div>
                      <div className="space-y-2 text-white/90">
                        <p><span className="font-semibold">{totalVotes}</span> votes on <span className="font-semibold">{setlistSongs.length}</span> songs</p>
                        <p>Status: <span className="font-semibold capitalize">{show.status}</span></p>
                        {show.ticketmaster_url && (
                          <p><a href={show.ticketmaster_url} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200">Get Tickets</a></p>
                        )}
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
                  
                  {show.ticketmaster_url && (
                    <Button asChild size="lg" variant="outline">
                      <a 
                        href={show.ticketmaster_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-white border-white/30 hover:bg-white/10"
                      >
                        Get Tickets
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Voting Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-headline font-bold gradient-text mb-4">
                  Vote on the Setlist
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Help influence what {artist.name} plays at this show! Vote for your favorite songs and see what the community wants to hear.
                </p>
              </div>

              {setlistSongs.length > 0 ? (
                <VotingSection
                  showId={params.id}
                  songs={setlistSongs}
                  showData={showData}
                  userVotes={[]}
                />
              ) : (
                <div className="text-center py-12">
                  <Music className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Songs Available Yet</h3>
                  <p className="text-muted-foreground">
                    The setlist for this show is being prepared. Check back soon!
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* How Voting Works */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold text-center mb-8">How Voting Works</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🗳️</span>
                  </div>
                  <h4 className="font-semibold mb-2">Vote for Your Favorites</h4>
                  <p className="text-sm text-muted-foreground">
                    Choose up to 10 songs you want to hear at this show
                  </p>
                </Card>
                
                <Card className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📊</span>
                  </div>
                  <h4 className="font-semibold mb-2">See Community Results</h4>
                  <p className="text-sm text-muted-foreground">
                    Watch votes update in real-time as fans participate
                  </p>
                </Card>
                
                <Card className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🎵</span>
                  </div>
                  <h4 className="font-semibold mb-2">Compare with Actual</h4>
                  <p className="text-sm text-muted-foreground">
                    After the show, see how your votes matched the real setlist
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
    )
  } catch (error) {
    console.error('Show page error:', error)
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Show Not Found</h1>
          <p className="text-muted-foreground">Unable to load this show. Please try again later.</p>
        </div>
      </main>
    )
  }
}
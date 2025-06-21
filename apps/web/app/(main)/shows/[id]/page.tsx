import { Calendar, MapPin, ExternalLink, Music, TrendingUp, Heart, Users } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { VotingSection } from '@/components/voting/VotingSection'

export default async function ShowPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies })

  try {
    // Get show with artist and venue data
    const { data: showData, error } = await supabase
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
      .eq('id', params.id)
      .single()

    if (error || !showData) {
      console.error('Error fetching show:', error)
      notFound()
    }

    // Get artist and venue data separately
    const [artistResult, venueResult] = await Promise.all([
      supabase
        .from('artists')
        .select('id, name, slug, image_url, spotify_id, genres')
        .eq('id', showData.artist_id)
        .single(),
      supabase
        .from('venues')
        .select('id, name, city, state, capacity')
        .eq('id', showData.venue_id)
        .single()
    ])

    if (artistResult.error || venueResult.error || !artistResult.data || !venueResult.data) {
      console.error('Error fetching artist/venue:', artistResult.error, venueResult.error)
      notFound()
    }

    const artist = artistResult.data
    const venue = venueResult.data

    // Get current user for vote checking
    const { data: { user } } = await supabase.auth.getUser()

    // Get setlist data
    const { data: setlistData } = await supabase
      .from('setlists')
      .select(`
        id,
        setlist_songs!inner(
          id,
          position,
          vote_count,
          songs!inner(
            id,
            title,
            album,
            duration_ms,
            popularity,
            spotify_id
          )
        )
      `)
            .eq('show_id', params.id)
      .single()

    // Get user votes for this show
    let userVotes: any[] = []
    if (user) {
      const { data: votes } = await supabase
        .from('votes')
        .select('setlist_song_id')
        .eq('user_id', user.id)
        .eq('show_id', params.id)
      userVotes = votes || []
    }

    const userVoteSet = new Set(userVotes.map(v => v.setlist_song_id))

    const setlistSongs = setlistData?.setlist_songs?.map((ss: any) => ({
      id: ss.id,
      position: ss.position,
      votes: ss.vote_count || 0,
      hasVoted: userVoteSet.has(ss.id),
      canVote: true,
      song: {
        id: ss.songs.id,
        name: ss.songs.title,
        album: ss.songs.album,
        duration: ss.songs.duration_ms,
        popularity: ss.songs.popularity,
        spotifyUrl: ss.songs.spotify_id ? `https://open.spotify.com/track/${ss.songs.spotify_id}` : null,
        previewUrl: null
      }
    })) || []

    const totalVotes = setlistSongs.reduce((sum: number, song: any) => sum + song.votes, 0)
    const showTitle = showData.title || `${artist.name} at ${venue.name}`

    return (
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="relative bg-black text-white overflow-hidden">
          <div className="absolute inset-0 bg-black" />
          
          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              {/* Artist Image */}
              <div className="flex-shrink-0">
                {artist.image_url ? (
                  <img
                    src={artist.image_url}
                    alt={artist.name}
                    className="w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 rounded-full object-cover shadow-2xl border-4 border-white/20"
                  />
                ) : (
                  <div className="w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 rounded-full bg-gray-800 flex items-center justify-center shadow-2xl border-4 border-white/20">
                    <Music className="w-20 h-20 text-white/60" />
                  </div>
                )}
              </div>
              
              {/* Show Info */}
              <div className="flex-1 text-center lg:text-left">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-headline font-bold mb-4 text-white">
                  {showTitle}
                </h1>
                
                <Link 
                  href={`/artists/${artist.slug}`}
                  className="text-xl sm:text-2xl text-white/90 hover:text-white transition-colors mb-6 inline-block font-semibold"
                >
                  {artist.name}
                </Link>
                
                {/* Event Details */}
                <div className="flex flex-wrap gap-6 justify-center lg:justify-start mb-8 text-white/90">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <span className="font-medium">
                      {new Date(showData.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    <span className="font-medium">
                      {venue.name}, {venue.city}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-medium">
                      {totalVotes} votes on {setlistSongs.length} songs
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                  {artist.spotify_id && (
                    <Link
                      href={`https://open.spotify.com/artist/${artist.spotify_id}`}
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
                  {showData.ticketmaster_url && (
                    <Link
                      href={showData.ticketmaster_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Buy Tickets
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Voting Section */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 flex items-center justify-center gap-2">
                <Heart className="w-8 h-8 text-red-500" />
                Vote on the Setlist
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Help shape the perfect concert! Vote on songs you'd love to hear {artist.name} perform at this show.
              </p>
            </div>

            {setlistSongs.length > 0 ? (
              <VotingSection
                showId={params.id}
                songs={setlistSongs}
                showData={showData}
                userVotes={userVotes}
                onVote={async (songId: string, setlistSongId: string) => {
                  // This will be handled by the VotingSection component
                }}
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

            {/* Show Info */}
            <div className="mt-12 grid md:grid-cols-2 gap-8">
              <div className="bg-card rounded-xl p-6 border border-border">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  About This Show
                </h3>
                <div className="space-y-3 text-sm">
                  <p><strong>Artist:</strong> {artist.name}</p>
                  <p><strong>Venue:</strong> {venue.name}</p>
                  <p><strong>Date:</strong> {new Date(showData.date).toLocaleDateString()}</p>
                  <p><strong>Status:</strong> {showData.status}</p>
                  <p><strong>Total Votes:</strong> {totalVotes}</p>
                  <p><strong>Songs Available:</strong> {setlistSongs.length}</p>
                  {venue.capacity && <p><strong>Venue Capacity:</strong> {venue.capacity.toLocaleString()}</p>}
                </div>
              </div>

              <div className="bg-card rounded-xl p-6 border border-border">
                <h3 className="text-xl font-semibold mb-4">How Voting Works</h3>
                <div className="space-y-3 text-sm">
                  <p>• Vote for songs you want to hear at this concert</p>
                  <p>• Songs with more votes are more likely to be played</p>
                  <p>• You can vote on multiple songs per show</p>
                  <p>• Voting helps artists understand fan preferences</p>
                  <p>• Results influence the actual setlist planning</p>
                </div>
              </div>
            </div>

            {/* Related Actions */}
            <div className="mt-12 text-center">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href={`/artists/${artist.slug}`}
                  className="btn-primary"
                >
                  View More {artist.name} Shows
                </Link>
                <Link
                  href="/explore"
                  className="btn-secondary"
                >
                  Explore Other Shows
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )

  } catch (error) {
    console.error('Error in show page:', error)
    notFound()
  }
}
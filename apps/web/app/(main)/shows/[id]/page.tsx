import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Calendar, MapPin, ExternalLink, Music, TrendingUp, Heart } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { VotingSection } from '@/components/voting/VotingSection'

export default async function ShowPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies })

  // Get show data with full voting relationships
  const { data: showData, error } = await supabase
    .from('shows')
    .select(`
      id,
      date,
      title,
      status,
      ticketmaster_url,
      view_count,
      artist:artists!inner (
        id,
        name,
        slug,
        image_url,
        genres,
        spotify_id
      ),
      venue:venues!inner (
        id,
        name,
        city,
        state,
        country
      ),
      setlists!inner (
        id,
        name,
        order_index,
        is_encore,
        setlist_songs!inner (
          id,
          position,
          vote_count,
          notes,
          song:songs!inner (
            id,
            title,
            album,
            popularity,
            duration_ms,
            preview_url,
            spotify_url
          )
        )
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !showData) {
    console.error('Show not found:', error)
    notFound()
  }

  // Transform the data structure for our components
  const show = {
    ...showData,
    artist: Array.isArray(showData.artist) ? showData.artist[0] : showData.artist,
    venue: Array.isArray(showData.venue) ? showData.venue[0] : showData.venue,
  }

  const showTitle = show.title || `${show.artist?.name} at ${show.venue?.name}`

  // Get current user for voting features
  const { data: { user } } = await supabase.auth.getUser()

  // Get user's votes for this show if logged in
  let userVotes: any[] = []
  if (user) {
    const { data: votes } = await supabase
      .from('votes')
      .select('setlist_song_id')
      .eq('user_id', user.id)
      .eq('show_id', params.id)
    
    userVotes = votes || []
  }

  // Transform setlist data for voting component
  const setlistSongs = show.setlists?.[0]?.setlist_songs?.map((ss: any) => ({
    id: ss.id,
    position: ss.position,
    votes: ss.vote_count || 0,
    notes: ss.notes,
    hasVoted: userVotes.some(v => v.setlist_song_id === ss.id),
    canVote: true, // Allow voting for all users
    song: {
      id: ss.song.id,
      name: ss.song.title,
      album: ss.song.album,
      duration: ss.song.duration_ms,
      duration_ms: ss.song.duration_ms, // Add this for interface compatibility
      popularity: ss.song.popularity,
      previewUrl: ss.song.preview_url,
      spotifyUrl: ss.song.spotify_url
    }
  })) || []

  // Calculate total votes for this show
  const totalVotes = setlistSongs.reduce((sum, song) => sum + song.votes, 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Show Header */}
      <div className="bg-gradient-to-b from-background via-muted/30 to-[#122727] border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row gap-6 sm:gap-8">
            {/* Artist Image */}
            {show.artist?.image_url && (
              <img
                src={show.artist.image_url}
                alt={show.artist.name}
                className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full object-cover shadow-xl mx-auto md:mx-0"
              />
            )}
            
            {/* Show Info */}
            <div className="flex-1">
              <div className="text-center md:text-left">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4 text-white">
                  {showTitle}
                </h1>
                
                <Link 
                  href={`/artists/${show.artist?.slug}`}
                  className="text-lg sm:text-xl md:text-2xl text-white/80 hover:text-white transition-colors mb-4 inline-block"
                >
                  {show.artist?.name}
                </Link>
                
                {/* Event Details */}
                <div className="space-y-2 sm:space-y-3 mb-6">
                  <div className="flex items-center gap-2 sm:gap-3 justify-center md:justify-start">
                    <Calendar className="w-5 h-5 text-white/80" />
                    <span className="text-white/90 text-sm sm:text-base">
                      {new Date(show.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 sm:gap-3 justify-center md:justify-start">
                    <MapPin className="w-5 h-5 text-white/80" />
                    <span className="text-white/90 text-sm sm:text-base">
                      {show.venue?.name}, {show.venue?.city}, {show.venue?.state || show.venue?.country}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 justify-center md:justify-start">
                    <TrendingUp className="w-5 h-5 text-white/80" />
                    <span className="text-white/90 text-sm sm:text-base">
                      {totalVotes} total votes on {setlistSongs.length} songs
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start items-center">
                  {show.ticketmaster_url && (
                    <Link
                      href={show.ticketmaster_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm sm:text-base"
                    >
                      <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">Get Tickets</span>
                      <span className="sm:hidden">Tickets</span>
                    </Link>
                  )}
                  
                  {show.artist?.spotify_id && (
                    <Link
                      href={`https://open.spotify.com/artist/${show.artist.spotify_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#1DB954] text-white rounded-lg font-medium hover:bg-[#1aa34a] transition-colors text-sm sm:text-base"
                    >
                      <Music className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">Listen on Spotify</span>
                      <span className="sm:hidden">Spotify</span>
                    </Link>
                  )}
                </div>
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
              Help shape the perfect concert! Vote on songs you'd love to hear {show.artist?.name} perform at this show.
              {!user && " Sign in to cast your votes and make your voice heard!"}
            </p>
            {user && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-2 font-medium">
                ✓ You're signed in and ready to vote!
              </p>
            )}
          </div>

          {/* Voting Component */}
          <VotingSection 
            showId={params.id}
            songs={setlistSongs}
            showData={show}
            userVotes={userVotes}
            onVote={async (songId: string, setlistSongId: string) => {
              // This will be handled by the VotingSection component's client-side logic
              console.log('Vote triggered:', { songId, setlistSongId })
            }}
          />

          {/* Additional Show Info */}
          <div className="mt-12 grid md:grid-cols-2 gap-8">
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Music className="w-5 h-5" />
                About This Show
              </h3>
              <div className="space-y-3 text-sm">
                <p><strong>Artist:</strong> {show.artist?.name}</p>
                <p><strong>Venue:</strong> {show.venue?.name}</p>
                <p><strong>Date:</strong> {new Date(show.date).toLocaleDateString()}</p>
                <p><strong>Status:</strong> {show.status}</p>
                <p><strong>Total Votes:</strong> {totalVotes}</p>
                <p><strong>Competing Songs:</strong> {setlistSongs.length}</p>
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
                href={`/artists/${show.artist?.slug}`}
                className="btn-primary"
              >
                View More {show.artist?.name} Shows
              </Link>
              <Link
                href="/shows"
                className="btn-secondary"
              >
                Explore All Shows
              </Link>
              <Link
                href="/trending"
                className="btn-secondary"
              >
                See Trending Shows
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
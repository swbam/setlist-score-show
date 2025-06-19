import { Calendar, MapPin, ExternalLink, Music, TrendingUp, Heart, Users } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { VotingSection } from '@/components/voting/VotingSection'
import { graphqlClient } from '@/lib/graphql-client'
import { GET_SHOW_WITH_SETLIST } from '@/lib/graphql/queries'

export default async function ShowPage({ params }: { params: { id: string } }) {
  let showData

  try {
    const result: any = await graphqlClient.request(GET_SHOW_WITH_SETLIST, { id: params.id })
    showData = result.show
  } catch (error) {
    console.error('Error fetching show:', error)
    notFound()
  }

  if (!showData) {
    notFound()
  }

  const showTitle = showData.title || `${showData.artist?.name} at ${showData.venue?.name}`

  // Transform setlist data for voting component
  const setlistSongs = showData.setlist?.setlistSongs?.map((ss: any) => ({
    id: ss.id,
    position: ss.position,
    votes: ss.voteCount || 0,
    notes: ss.notes,
    hasVoted: false, // Will be set by client-side voting component
    canVote: true,
    song: {
      id: ss.song.id,
      name: ss.song.title,
      album: ss.song.album,
      duration: ss.song.durationMs,
      duration_ms: ss.song.durationMs,
      popularity: ss.song.popularity,
      previewUrl: ss.song.previewUrl,
      spotifyUrl: ss.song.spotifyUrl
    }
  })) || []

  // Calculate total votes for this show
  const totalVotes = setlistSongs.reduce((sum: number, song: any) => sum + song.votes, 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Teal Gradient */}
      <div className="relative bg-gradient-to-br from-teal-950 via-teal-900 to-emerald-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Artist Image */}
            <div className="flex-shrink-0">
              {showData.artist?.imageUrl ? (
                <img
                  src={showData.artist.imageUrl}
                  alt={showData.artist.name}
                  className="w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 rounded-full object-cover shadow-2xl border-4 border-white/20"
                />
              ) : (
                <div className="w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 rounded-full bg-gradient-to-br from-teal-600 to-emerald-600 flex items-center justify-center shadow-2xl border-4 border-white/20">
                  <Music className="w-20 h-20 text-white/60" />
                </div>
              )}
            </div>
            
            {/* Show Info */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-headline font-bold mb-4 bg-gradient-to-r from-white to-teal-100 bg-clip-text text-transparent">
                {showTitle}
              </h1>
              
              <Link 
                href={`/artists/${showData.artist?.slug}`}
                className="text-xl sm:text-2xl text-white/90 hover:text-white transition-colors mb-6 inline-block font-semibold"
              >
                {showData.artist?.name}
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
                    {showData.venue?.name}, {showData.venue?.city}
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
                {showData.artist?.spotifyId && (
                  <Link
                    href={`https://open.spotify.com/artist/${showData.artist.spotifyId}`}
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
                  Follow Show
                </button>
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
              Help shape the perfect concert! Vote on songs you'd love to hear {showData.artist?.name} perform at this show.
            </p>
          </div>

          {/* Voting Component */}
          <VotingSection 
            showId={params.id}
            songs={setlistSongs}
            showData={showData}
            userVotes={[]}
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
                <p><strong>Artist:</strong> {showData.artist?.name}</p>
                <p><strong>Venue:</strong> {showData.venue?.name}</p>
                <p><strong>Date:</strong> {new Date(showData.date).toLocaleDateString()}</p>
                <p><strong>Status:</strong> {showData.status}</p>
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
                href={`/artists/${showData.artist?.slug}`}
                className="btn-primary"
              >
                View More {showData.artist?.name} Shows
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
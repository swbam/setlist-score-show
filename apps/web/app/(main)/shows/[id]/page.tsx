import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Calendar, MapPin, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SimpleVotingDemo } from '@/components/voting/SimpleVotingDemo'

// Simple show page without the complex voting section for now
export default async function ShowPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies })

  // Get show data from Supabase with basic relations
  const { data: showData, error } = await supabase
    .from('shows')
    .select(`
      id,
      date,
      name,
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
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !showData) {
    console.error('Show not found:', error)
    notFound()
  }

  // Transform the data structure since Supabase returns arrays for relations
  const show = {
    ...showData,
    artist: Array.isArray(showData.artist) ? showData.artist[0] : showData.artist,
    venue: Array.isArray(showData.venue) ? showData.venue[0] : showData.venue,
  }

  const showTitle = show.title || show.name || `${show.artist?.name} at ${show.venue?.name}`

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
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                      </svg>
                      <span className="hidden sm:inline">Spotify</span>
                      <span className="sm:hidden">♪</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Voting/Setlist Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">🎵 Vote on Songs</h2>
          <p className="text-muted-foreground mb-6">
            Help shape the setlist! Vote on songs you'd love to hear at this show.
          </p>
          
          {/* Simple voting simulation */}
          <SimpleVotingDemo />
          
          <div className="flex gap-4 justify-center mt-8">
            <Link
              href={`/artists/${show.artist?.slug}`}
              className="btn-primary"
            >
              View Artist
            </Link>
            <Link
              href="/shows"
              className="btn-secondary"
            >
              Browse Shows
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
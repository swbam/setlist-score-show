import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Calendar, MapPin, Users, Music, ExternalLink, Heart } from 'lucide-react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { notFound } from 'next/navigation'
import { ShowCard } from '@/components/shows/ShowCard'

export default async function ArtistPage({ params }: { params: { slug: string } }) {
  const supabase = createServerComponentClient({ cookies })

  console.log('Looking for artist with slug:', params.slug)

  // Get artist data from Supabase without complex joins
  const { data: artistData, error } = await supabase
    .from('artists')
    .select(`
      id,
      name,
      slug,
      image_url,
      genres,
      popularity,
      followers,
      spotify_id
    `)
    .eq('slug', params.slug)
    .single()

  console.log('Supabase query result:', { data: artistData, error })

  if (error || !artistData) {
    console.error('Artist not found:', error)
    notFound()
  }

  // Get shows separately to avoid complex joins
  const { data: showsData } = await supabase
    .from('shows')
    .select(`
      id,
      date,
      name,
      status,
      view_count,
      ticketmaster_url,
      venue:venues!inner (
        id,
        name,
        city,
        state,
        country
      )
    `)
    .eq('artist_id', artistData.id)
    .order('date', { ascending: false })
    .limit(20)

  const now = new Date()
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

  const upcomingShows = showsData?.filter((show: any) => 
    new Date(show.date) > now
  ) || []
  
  const pastShows = showsData?.filter((show: any) => {
    const showDate = new Date(show.date)
    return showDate <= now && showDate >= oneMonthAgo
  }).slice(0, 10) || []

  return (
    <div className="min-h-screen bg-background">
      {/* Artist Header */}
      <div className="bg-gradient-to-b from-background via-muted/30 to-[#122727] border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col items-center gap-6 sm:gap-8">
            {/* Artist Image */}
            {artistData.image_url && (
              <img
                src={artistData.image_url}
                alt={artistData.name}
                className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full object-cover shadow-xl"
              />
            )}
            
            {/* Artist Info */}
            <div className="flex-1 text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-white px-2">
                {artistData.name}
              </h1>
              
              {/* Stats */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-6 px-4">
                {artistData.followers && (
                  <div className="flex items-center gap-2 justify-center">
                    <Users className="w-5 h-5 text-white/80" />
                    <span className="text-white/90 text-sm sm:text-base">
                      {artistData.followers.toLocaleString()} followers
                    </span>
                  </div>
                )}
                {artistData.genres?.length > 0 && (
                  <div className="flex items-center gap-2 justify-center">
                    <Music className="w-5 h-5 text-white/80" />
                    <span className="text-white/90 text-sm sm:text-base">
                      {artistData.genres.slice(0, 3).join(', ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
                {artistData.spotify_id && (
                  <Link
                    href={`https://open.spotify.com/artist/${artistData.spotify_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#1DB954] text-white rounded-lg font-medium hover:bg-[#1aa34a] transition-colors text-sm sm:text-base"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                    <span className="hidden sm:inline">Listen on Spotify</span>
                    <span className="sm:hidden">Spotify</span>
                  </Link>
                )}
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
                {upcomingShows.map((show: any) => (
                  <ShowCard 
                    key={show.id} 
                    show={{
                      id: show.id,
                      date: show.date,
                      title: show.name || `${artistData.name} at ${show.venue?.name}`,
                      status: show.status || 'upcoming',
                      viewCount: show.view_count || 0,
                      artist: {
                        id: artistData.id,
                        name: artistData.name,
                        slug: artistData.slug,
                        imageUrl: artistData.image_url
                      },
                      venue: {
                        id: show.venue?.id || (Array.isArray(show.venue) ? show.venue[0]?.id : show.venue?.id),
                        name: show.venue?.name || (Array.isArray(show.venue) ? show.venue[0]?.name : show.venue?.name) || 'Unknown Venue',
                        city: show.venue?.city || (Array.isArray(show.venue) ? show.venue[0]?.city : show.venue?.city) || 'Unknown City',
                        state: show.venue?.state || (Array.isArray(show.venue) ? show.venue[0]?.state : show.venue?.state),
                        country: show.venue?.country || (Array.isArray(show.venue) ? show.venue[0]?.country : show.venue?.country) || 'Unknown Country'
                      },
                      _count: { votes: 0 }
                    }} 
                  />
                ))}
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
                {pastShows.map((show: any) => (
                  <ShowCard 
                    key={show.id} 
                    show={{
                      id: show.id,
                      date: show.date,
                      title: show.name || `${artistData.name} at ${show.venue?.name}`,
                      status: show.status || 'completed',
                      viewCount: show.view_count || 0,
                      artist: {
                        id: artistData.id,
                        name: artistData.name,
                        slug: artistData.slug,
                        imageUrl: artistData.image_url
                      },
                      venue: {
                        id: show.venue?.id || (Array.isArray(show.venue) ? show.venue[0]?.id : show.venue?.id),
                        name: show.venue?.name || (Array.isArray(show.venue) ? show.venue[0]?.name : show.venue?.name) || 'Unknown Venue',
                        city: show.venue?.city || (Array.isArray(show.venue) ? show.venue[0]?.city : show.venue?.city) || 'Unknown City',
                        state: show.venue?.state || (Array.isArray(show.venue) ? show.venue[0]?.state : show.venue?.state),
                        country: show.venue?.country || (Array.isArray(show.venue) ? show.venue[0]?.country : show.venue?.country) || 'Unknown Country'
                      },
                      _count: { votes: 0 }
                    }} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No recent shows</h3>
                <p className="text-muted-foreground">
                  No shows found in the past month.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
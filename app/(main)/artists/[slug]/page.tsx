'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { ShowCard } from '@/components/shows/ShowCard'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Music, Users, Calendar } from 'lucide-react'

interface ArtistPageProps {
  params: {
    slug: string
  }
}

export default function ArtistPage({ params }: ArtistPageProps) {
  // Fetch artist data
  const { data: artist, isLoading: artistLoading } = useQuery({
    queryKey: ['artist', params.slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artists')
        .select(`
          *,
          shows(
            *,
            venue:venues(*),
            setlists(
              setlist_songs(
                votes(count)
              )
            )
          ),
          songs(count)
        `)
        .eq('slug', params.slug)
        .single()

      if (error) throw error
      return data
    }
  })

  // Calculate upcoming and past shows
  const upcomingShows = artist?.shows?.filter(show => 
    new Date(show.date) >= new Date() && show.status !== 'cancelled'
  ) || []
  
  const pastShows = artist?.shows?.filter(show => 
    new Date(show.date) < new Date() || show.status === 'completed'
  ) || []

  if (artistLoading) {
    return <ArtistPageSkeleton />
  }

  if (!artist) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-400">Artist not found</h1>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Artist Header */}
      <div className="mb-12">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <Avatar className="w-32 h-32 md:w-48 md:h-48 ring-4 ring-teal-500/20">
            <AvatarImage src={artist.image_url} alt={artist.name} />
            <AvatarFallback className="text-4xl bg-gradient-to-br from-teal-500 to-cyan-500">
              {artist.name.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
              {artist.name}
            </h1>
            
            <div className="flex flex-wrap gap-2 mb-4 justify-center md:justify-start">
              {artist.genres?.map((genre: string) => (
                <Badge key={genre} variant="secondary" className="bg-gray-800 text-gray-300">
                  {genre}
                </Badge>
              ))}
            </div>

            <div className="flex flex-wrap gap-6 text-gray-400 justify-center md:justify-start">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>{artist.followers?.toLocaleString() || 0} followers</span>
              </div>
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5" />
                <span>{artist.songs?.[0]?.count || 0} songs</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{upcomingShows.length} upcoming shows</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Shows */}
      {upcomingShows.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="gradient-text">Upcoming Shows</span>
            <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/50">
              {upcomingShows.length}
            </Badge>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingShows.map((show) => (
              <ShowCard 
                key={show.id} 
                show={{
                  ...show,
                  artist: artist,
                  _count: {
                    votes: show.setlists?.reduce((total, setlist) => 
                      total + (setlist.setlist_songs?.reduce((setlistTotal, song) => 
                        setlistTotal + (song.votes?.length || 0), 0) || 0), 0) || 0
                  }
                }} 
              />
            ))}
          </div>
        </section>
      )}

      {/* Past Shows */}
      {pastShows.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6 text-gray-400">
            Past Shows ({pastShows.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
            {pastShows.map((show) => (
              <ShowCard 
                key={show.id} 
                show={{
                  ...show,
                  artist: artist,
                  _count: {
                    votes: show.setlists?.reduce((total, setlist) => 
                      total + (setlist.setlist_songs?.reduce((setlistTotal, song) => 
                        setlistTotal + (song.votes?.length || 0), 0) || 0), 0) || 0
                  }
                }} 
              />
            ))}
          </div>
        </section>
      )}

      {/* No shows message */}
      {artist.shows?.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">No shows scheduled for this artist</p>
        </div>
      )}
    </div>
  )
}

function ArtistPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-12">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <Skeleton className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-gray-800" />
          <div className="text-center md:text-left">
            <Skeleton className="h-12 w-64 mb-4 bg-gray-800" />
            <div className="flex gap-2 mb-4">
              <Skeleton className="h-6 w-20 bg-gray-800" />
              <Skeleton className="h-6 w-20 bg-gray-800" />
              <Skeleton className="h-6 w-20 bg-gray-800" />
            </div>
            <div className="flex gap-6">
              <Skeleton className="h-5 w-32 bg-gray-800" />
              <Skeleton className="h-5 w-24 bg-gray-800" />
              <Skeleton className="h-5 w-40 bg-gray-800" />
            </div>
          </div>
        </div>
      </div>

      <section>
        <Skeleton className="h-8 w-48 mb-6 bg-gray-800" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 bg-gray-800" />
          ))}
        </div>
      </section>
    </div>
  )
}
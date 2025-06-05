'use client'

import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/lib/graphql-client'
import { GET_ARTIST } from '@/lib/graphql/queries'
import { Calendar, MapPin, Users, Music, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { notFound } from 'next/navigation'

export default function ArtistPage({ params }: { params: { slug: string } }) {
  const client = useGraphQLClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['artist', params.slug],
    queryFn: async () => {
      return client.request(GET_ARTIST, { slug: params.slug })
    }
  })

  if (isLoading) return <ArtistPageSkeleton />
  
  if (error || !data?.artistBySlug) {
    notFound()
  }

  const artist = (data as any).artistBySlug
  const upcomingShows = artist.shows?.filter((show: any) => 
    new Date(show.date) > new Date()
  ) || []
  const pastShows = artist.shows?.filter((show: any) => 
    new Date(show.date) <= new Date()
  ) || []

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Artist Header */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 border-b border-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            {/* Artist Image */}
            {artist.imageUrl && (
              <img
                src={artist.imageUrl}
                alt={artist.name}
                className="w-48 h-48 rounded-full object-cover shadow-xl"
              />
            )}
            
            {/* Artist Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
                {artist.name}
              </h1>
              
              {/* Stats */}
              <div className="flex flex-wrap gap-6 justify-center md:justify-start mb-6">
                {artist.followers && (
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-300">
                      {artist.followers.toLocaleString()} followers
                    </span>
                  </div>
                )}
                {artist.genres?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Music className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-300">
                      {artist.genres.slice(0, 3).join(', ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-4 justify-center md:justify-start">
                {artist.spotifyId && (
                  <Link
                    href={`https://open.spotify.com/artist/${artist.spotifyId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#1DB954] text-white rounded-lg font-medium hover:bg-[#1aa34a] transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                    Listen on Spotify
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shows */}
      <div className="container mx-auto px-4 py-8">
        {/* Upcoming Shows */}
        {upcomingShows.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Upcoming Shows</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingShows.map((show: any) => (
                <Link
                  key={show.id}
                  href={`/shows/${show.id}`}
                  className="gradient-card rounded-lg p-6 border border-gray-800 hover:border-teal-500/30 transition-all duration-300 card-hover"
                >
                  <div className="flex flex-col h-full">
                    <div className="space-y-2 text-sm text-gray-400 mb-4 flex-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{show.venue.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(show.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      {show.venue.city && (
                        <div className="text-gray-500">
                          {show.venue.city}, {show.venue.state || show.venue.country}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-800">
                      <span className="text-sm font-medium text-teal-400">
                        Vote Now →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Past Shows */}
        {pastShows.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Past Shows</h2>
            <div className="space-y-3">
              {pastShows.slice(0, 10).map((show: any) => (
                <Link
                  key={show.id}
                  href={`/shows/${show.id}`}
                  className="block gradient-card rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-all duration-300"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{show.venue.name}</p>
                      <p className="text-sm text-gray-400">
                        {show.venue.city}, {show.venue.state || show.venue.country}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(show.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* No shows message */}
        {!upcomingShows.length && !pastShows.length && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No shows found for this artist.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ArtistPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-950">
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 border-b border-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            <Skeleton className="w-48 h-48 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-12 w-64 mb-4" />
              <Skeleton className="h-6 w-48 mb-6" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    </div>
  )
}
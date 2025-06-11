'use client'

import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/lib/graphql-client'
import { GET_ARTIST } from '@/lib/graphql/queries'
import { Calendar, MapPin, Users, Music, ExternalLink, Heart } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { notFound } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function ArtistPage({ params }: { params: { slug: string } }) {
  const client = useGraphQLClient()
  const { user } = useAuth()
  const [isFollowing, setIsFollowing] = useState(false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['artist', params.slug],
    queryFn: async () => {
      return client.request(GET_ARTIST, { slug: params.slug })
    }
  })

  const artist = (data as any)?.artistBySlug

  // Check if user is following this artist
  useEffect(() => {
    const checkFollowing = async () => {
      if (!user || !artist) return
      
      const { data: follows } = await supabase
        .from('user_follows_artist')
        .select('id')
        .eq('user_id', user.id)
        .eq('artist_id', artist.id)
        .single()
      
      setIsFollowing(!!follows)
    }
    
    checkFollowing()
  }, [user, artist])

  const handleFollow = async () => {
    if (!user || !artist) {
      toast.error('Please sign in to follow artists')
      return
    }
    
    setIsFollowLoading(true)
    
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('user_follows_artist')
          .delete()
          .eq('user_id', user.id)
          .eq('artist_id', artist.id)
        
        if (error) throw error
        
        setIsFollowing(false)
        toast.success(`Unfollowed ${artist.name}`)
      } else {
        // Follow
        const { error } = await supabase
          .from('user_follows_artist')
          .insert({
            user_id: user.id,
            artist_id: artist.id
          })
        
        if (error) throw error
        
        setIsFollowing(true)
        toast.success(`Now following ${artist.name}`)
      }
    } catch (error) {
      toast.error('Failed to update follow status')
      console.error('Follow error:', error)
    } finally {
      setIsFollowLoading(false)
    }
  }

  if (isLoading) return <ArtistPageSkeleton />
  
  if (error || !artist) {
    notFound()
  }

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
                <button
                  onClick={handleFollow}
                  disabled={isFollowLoading}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isFollowing 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Heart className={`w-5 h-5 ${isFollowing ? 'fill-current' : ''}`} />
                  {isFollowLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
                </button>
                
                <button
                  onClick={async () => {
                    const response = await fetch('/api/sync-artist', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ artistId: artist.id })
                    })
                    if (response.ok) {
                      toast.success('Artist data synced successfully')
                      window.location.reload()
                    } else {
                      toast.error('Failed to sync artist data')
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync Latest Data
                </button>
                
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
            <h2 className="text-3xl font-headline font-bold mb-8 gradient-text">Upcoming Shows</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcomingShows.map((show: any) => (
                <Link
                  key={show.id}
                  href={`/shows/${show.id}`}
                  className="card-base p-8 group block"
                >
                  <div className="flex flex-col h-full">
                    <div className="space-y-3 text-base text-muted-foreground mb-6 flex-1 font-body">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-accent" />
                        <span className="font-medium">{show.venue.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-accent" />
                        <span className="font-medium">
                          {new Date(show.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      {show.venue.city && (
                        <div className="text-muted-foreground/70 font-medium">
                          {show.venue.city}, {show.venue.state || show.venue.country}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-border/30">
                      <span className="text-sm font-headline font-semibold text-primary group-hover:gradient-text transition-all duration-300">
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
            <h2 className="text-3xl font-headline font-bold mb-8 gradient-text">Past Shows</h2>
            <div className="space-y-4">
              {pastShows.slice(0, 10).map((show: any) => (
                <Link
                  key={show.id}
                  href={`/shows/${show.id}`}
                  className="block card-base p-6 group"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-lg font-headline font-semibold text-foreground group-hover:gradient-text transition-all duration-300">
                        {show.venue.name}
                      </p>
                      <p className="text-base text-muted-foreground font-body mt-1">
                        {show.venue.city}, {show.venue.state || show.venue.country}
                      </p>
                    </div>
                    <p className="text-base text-muted-foreground font-body">
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
'use client'

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useGraphQLClient } from '@/lib/graphql-client'
import { GET_SHOW_WITH_SETLIST } from '@/lib/graphql/queries'
import { 
  Calendar, 
  MapPin, 
  Users, 
  ExternalLink, 
  ArrowLeft, 
  Share, 
  Heart,
  Clock,
  Loader2,
  Music,
  TrendingUp,
  Star
} from 'lucide-react'
import Link from 'next/link'
import { VotingSection } from '@/components/voting/VotingSection'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function ShowPage({ params }: { params: { id: string } }) {
  const client = useGraphQLClient()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [setlistId, setSetlistId] = useState<string | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)

  // Fetch show data
  const { data: showData, isLoading: isLoadingShow, error } = useQuery({
    queryKey: ['show', params.id],
    queryFn: async () => {
      try {
        const data = await client.request(GET_SHOW_WITH_SETLIST, { id: params.id })
        return (data as any)?.show
      } catch (error) {
        console.error('GraphQL error, trying direct Supabase query:', error)
        
        // Fallback to direct Supabase query
        const { data: showData, error: supabaseError } = await supabase
          .from('shows')
          .select(`
            id,
            title,
            date,
            status,
            ticketmaster_url,
            created_at,
            artists (
              id,
              name,
              slug,
              image_url,
              genres,
              popularity,
              followers
            ),
            venues (
              id,
              name,
              city,
              state,
              country,
              address,
              latitude,
              longitude
            ),
            setlists (
              id,
              created_at
            )
          `)
          .eq('id', params.id)
          .single()

        if (supabaseError) throw supabaseError
        return showData
      }
    },
    retry: 1
  })

  const show = showData

  // Get setlist ID when show data loads
  useEffect(() => {
    if (show?.setlists?.[0]?.id) {
      setSetlistId(show.setlists[0].id)
    } else if (show?.id && show?.artists?.id) {
      // Create setlist if it doesn't exist
      createSetlistForShow()
    }
  }, [show])

  // Check if user is following this artist
  useEffect(() => {
    const checkFollowing = async () => {
      if (!user || !show?.artists?.id) return
      
      const { data } = await supabase
        .from('spotify_top_artists')
        .select('id')
        .eq('user_id', user.id)
        .eq('artist_id', show.artists.id)
        .single()
      
      setIsFollowing(!!data)
    }
    
    checkFollowing()
  }, [user, show?.artists?.id])

  const createSetlistForShow = async () => {
    if (!show?.id || !show?.artists?.id) return
    
    try {
      const { data, error } = await supabase.rpc('create_initial_setlist_for_show_v2', {
        show_id_param: show.id,
        artist_id_param: show.artists.id
      })

      if (error) throw error
      
      if (data?.success && data?.setlist_id) {
        setSetlistId(data.setlist_id)
      }
    } catch (error) {
      console.error('Error creating setlist:', error)
    }
  }

  const handleFollow = async () => {
    if (!user || !show?.artists) {
      toast.error('Please sign in to follow artists')
      return
    }
    
    setIsFollowLoading(true)
    
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('spotify_top_artists')
          .delete()
          .eq('user_id', user.id)
          .eq('artist_id', show.artists.id)
        
        if (error) throw error
        
        setIsFollowing(false)
        toast.success(`Unfollowed ${show.artists.name}`)
      } else {
        // Follow
        const { error } = await supabase
          .from('spotify_top_artists')
          .insert({
            user_id: user.id,
            artist_id: show.artists.id,
            rank: 999 // Default rank for manually followed artists
          })
        
        if (error) throw error
        
        setIsFollowing(true)
        toast.success(`Now following ${show.artists.name}`)
      }
    } catch (error) {
      toast.error('Failed to update follow status')
      console.error('Follow error:', error)
    } finally {
      setIsFollowLoading(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${show?.artists?.name} at ${show?.venues?.name}`,
          text: `Vote on the setlist for ${show?.artists?.name}'s upcoming show!`,
          url: window.location.href,
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Link copied to clipboard!')
      } catch (error) {
        toast.error('Failed to copy link')
      }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString()
    
    if (isToday) return 'Today'
    if (isTomorrow) return 'Tomorrow'
    
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getTimeUntilShow = () => {
    if (!show?.date) return null
    
    const showDate = new Date(show.date)
    const now = new Date()
    const diff = showDate.getTime() - now.getTime()
    
    if (diff <= 0) return 'Show has passed'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `in ${days} day${days > 1 ? 's' : ''}`
    if (hours > 0) return `in ${hours} hour${hours > 1 ? 's' : ''}`
    return 'very soon'
  }

  if (isLoadingShow) {
    return <ShowPageSkeleton />
  }

  if (error || !show) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-red-500/20 mb-6">
            <Music className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Show not found</h2>
          <p className="text-gray-400 mb-6">
            The show you're looking for doesn't exist or has been removed.
          </p>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-sm font-semibold hover:bg-gray-100 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Browse Shows
          </Link>
        </div>
      </div>
    )
  }

  const timeUntilShow = getTimeUntilShow()
  const isPastShow = new Date(show.date) < new Date()

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/explore"
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Shows</span>
              <span className="sm:hidden">Back</span>
            </Link>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={handleShare}
                className="p-2 sm:px-4 sm:py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-sm transition-all flex items-center gap-2"
              >
                <Share className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Share</span>
              </button>
              
              <button
                onClick={handleFollow}
                disabled={isFollowLoading}
                className={cn(
                  "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-sm font-semibold transition-all text-sm",
                  isFollowing
                    ? "bg-white/20 text-white hover:bg-white/30"
                    : "bg-white text-black hover:bg-gray-100",
                  isFollowLoading && "opacity-50 cursor-not-allowed"
                )}
              >
                {isFollowLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Heart className={cn("w-4 h-4", isFollowing && "fill-current")} />
                )}
                <span className="hidden sm:inline">
                  {isFollowLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Image */}
        {show.artists?.image_url && (
          <div className="absolute inset-0">
            <img
              src={show.artists.image_url}
              alt={show.artists.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40" />
          </div>
        )}
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
          <div className="text-center space-y-6">
            {/* Artist Image */}
            {show.artists?.image_url && (
              <div className="inline-block">
                <img
                  src={show.artists.image_url}
                  alt={show.artists.name}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white/20 shadow-2xl"
                />
              </div>
            )}
            
            {/* Artist Name */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              {show.artists?.name}
            </h1>
            
            {/* Show Title */}
            {show.title && show.title !== show.artists?.name && (
              <p className="text-xl sm:text-2xl text-white/80 font-medium">
                {show.title}
              </p>
            )}
            
            {/* Show Details */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 text-white/90">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-white/60" />
                <div className="text-center sm:text-left">
                  <div className="font-semibold">{formatDate(show.date)}</div>
                  <div className="text-sm text-white/60">{formatTime(show.date)}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-white/60" />
                <div className="text-center sm:text-left">
                  <div className="font-semibold">{show.venues?.name}</div>
                  <div className="text-sm text-white/60">
                    {show.venues?.city}, {show.venues?.state}
                  </div>
                </div>
              </div>
              
              {timeUntilShow && !isPastShow && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-white/60" />
                  <div className="text-center sm:text-left">
                    <div className="font-semibold">{timeUntilShow}</div>
                    <div className="text-sm text-white/60">until show</div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Status Badge */}
            <div className="flex justify-center">
              {isPastShow ? (
                <span className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded-full text-sm font-medium border border-gray-500/30">
                  Show Completed
                </span>
              ) : (
                <span className="px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-sm font-medium border border-green-500/30">
                  Voting Open
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Voting Section */}
          <div className="lg:col-span-2">
            {setlistId ? (
              <VotingSection 
                showId={show.id} 
                setlistId={setlistId}
                className="space-y-6"
              />
            ) : (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-white/60 mx-auto mb-4" />
                <p className="text-white/60">Setting up setlist...</p>
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Show Info Card */}
            <div className="bg-white/5 backdrop-blur-xl rounded-lg border border-white/10 p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-white/60" />
                Show Details
              </h3>
              
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Date</span>
                  <span className="text-white font-medium">{formatDate(show.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Time</span>
                  <span className="text-white font-medium">{formatTime(show.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Venue</span>
                  <span className="text-white font-medium">{show.venues?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Location</span>
                  <span className="text-white font-medium">
                    {show.venues?.city}, {show.venues?.state}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Status</span>
                  <span className={cn(
                    "font-medium",
                    isPastShow ? "text-gray-400" : "text-green-400"
                  )}>
                    {isPastShow ? 'Completed' : 'Upcoming'}
                  </span>
                </div>
              </div>
              
              {show.ticketmaster_url && (
                <div className="mt-6 pt-4 border-t border-white/10">
                  <a
                    href={show.ticketmaster_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-semibold transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Buy Tickets
                  </a>
                </div>
              )}
            </div>
            
            {/* Artist Info Card */}
            {show.artists && (
              <div className="bg-white/5 backdrop-blur-xl rounded-lg border border-white/10 p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-white/60" />
                  About the Artist
                </h3>
                
                <div className="space-y-4">
                  {show.artists.genres && show.artists.genres.length > 0 && (
                    <div>
                      <span className="text-white/60 text-sm">Genres</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {show.artists.genres.slice(0, 3).map((genre: string) => (
                          <span 
                            key={genre} 
                            className="px-2 py-1 bg-white/10 text-white text-xs rounded-sm"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {show.artists.popularity && (
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Popularity</span>
                      <span className="text-white font-medium">{show.artists.popularity}/100</span>
                    </div>
                  )}
                  
                  {show.artists.followers && (
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Followers</span>
                      <span className="text-white font-medium">
                        {show.artists.followers.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 pt-4 border-t border-white/10">
                  <Link
                    href={`/artists/${show.artists.slug}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-sm font-semibold transition-all border border-white/20"
                  >
                    View Artist Profile
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </Link>
                </div>
              </div>
            )}
            
            {/* How Voting Works */}
            <div className="bg-white/5 backdrop-blur-xl rounded-lg border border-white/10 p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-white/60" />
                How It Works
              </h3>
              
              <div className="space-y-4 text-sm text-white/80">
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-white/20 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <p>Vote for songs you want to hear at this show</p>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-white/20 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <p>Most voted songs rise to the top of the setlist</p>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-white/20 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <p>See how accurate fan predictions were after the show</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading skeleton
function ShowPageSkeleton() {
  return (
    <div className="min-h-screen bg-black">
      {/* Navigation Skeleton */}
      <div className="h-16 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
          <div className="flex gap-4">
            <div className="h-8 w-16 bg-white/10 rounded animate-pulse" />
            <div className="h-8 w-20 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
      </div>
      
      {/* Hero Skeleton */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-6">
          <div className="w-32 h-32 bg-white/10 rounded-full mx-auto animate-pulse" />
          <div className="h-12 w-80 bg-white/10 rounded-lg mx-auto animate-pulse" />
          <div className="h-6 w-60 bg-white/10 rounded-lg mx-auto animate-pulse" />
          <div className="flex justify-center gap-8">
            <div className="h-12 w-40 bg-white/10 rounded-lg animate-pulse" />
            <div className="h-12 w-40 bg-white/10 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
      
      {/* Content Skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 w-full bg-white/10 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 w-full bg-white/10 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
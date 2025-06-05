'use client'

import { useEffect, useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useGraphQLClient } from '@/lib/graphql-client'
import { GET_SHOW_WITH_SETLIST, GET_USER_VOTES, CAST_VOTE } from '@/lib/graphql/queries'
import { useRealtimeVotes } from '@/hooks/useRealtimeVotes'
import { VotingSection } from '@/components/voting/VotingSection'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, MapPin, Users, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface SetlistSong {
  id: string
  position: number
  vote_count: number
  song: {
    id: string
    title: string
    name?: string // Some APIs use name instead of title
    album: string
    duration_ms: number
    spotify_url?: string
  }
}

export default function ShowPage({ params }: { params: { id: string } }) {
  const queryClient = useQueryClient()
  const client = useGraphQLClient()
  const { user } = useAuth()
  const { 
    voteCounts, 
    isConnected, 
    optimisticVoteUpdate, 
    revertVoteUpdate,
    refreshVoteCounts
  } = useRealtimeVotes(params.id)
  
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set())
  const [voteLimits, setVoteLimits] = useState({
    showVotesRemaining: 10,
    dailyVotesRemaining: 50
  })

  // Fetch show data with songs
  const { data: showData, isLoading } = useQuery({
    queryKey: ['show', params.id],
    queryFn: async () => {
      return client.request(GET_SHOW_WITH_SETLIST, { id: params.id })
    }
  })

  const show = showData?.show

  // Fetch user's votes for this show
  const { data: userVotesData } = useQuery({
    queryKey: ['userVotes', params.id, user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const data = await client.request(GET_USER_VOTES, { showId: params.id })
      return data.userVotes?.map((v: any) => v.setlist_song_id) || []
    },
    enabled: !!user?.id
  })

  // Update user votes state
  useEffect(() => {
    if (userVotesData) {
      setUserVotes(new Set(userVotesData))
      setVoteLimits(prev => ({
        ...prev,
        showVotesRemaining: Math.max(0, 10 - userVotesData.length)
      }))
    }
  }, [userVotesData])

  // Set up vote mutation
  const voteMutation = useMutation({
    mutationFn: async ({ showId, setlistSongId }: { showId: string; setlistSongId: string }) => {
      return client.request(CAST_VOTE, { showId, setlistSongId })
    },
    onSuccess: (data) => {
      if (data.castVote?.votesRemaining) {
        setVoteLimits({
          showVotesRemaining: data.castVote.votesRemaining.show,
          dailyVotesRemaining: data.castVote.votesRemaining.daily
        })
      }
    }
  })

  // Handle voting
  const handleVote = async (songId: string, setlistSongId: string) => {
    if (!user) {
      // Show login prompt
      alert('Please sign in to vote')
      return
    }

    // Optimistic update
    optimisticVoteUpdate(setlistSongId)
    setUserVotes(prev => new Set([...prev, setlistSongId]))
    setVoteLimits(prev => ({
      ...prev,
      showVotesRemaining: Math.max(0, prev.showVotesRemaining - 1)
    }))

    try {
      await voteMutation.mutateAsync({
        showId: params.id,
        setlistSongId
      })

      // Refresh data
      await queryClient.invalidateQueries({ queryKey: ['userVotes', params.id] })
      await refreshVoteCounts()
    } catch (error) {
      // Revert on error
      console.error('Vote error:', error)
      revertVoteUpdate(setlistSongId)
      setUserVotes(prev => {
        const newSet = new Set(prev)
        newSet.delete(setlistSongId)
        return newSet
      })
      setVoteLimits(prev => ({
        ...prev,
        showVotesRemaining: prev.showVotesRemaining + 1
      }))
    }
  }

  if (isLoading) return <ShowPageSkeleton />

  if (!show) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Show not found</h1>
      </div>
    )
  }

  // Transform data for VotingSection
  const songs: SetlistSong[] = show.setlists?.[0]?.setlist_songs?.map((ss: any) => ({
    id: ss.id,
    position: ss.position,
    votes: voteCounts[ss.id] || ss.vote_count || 0,
    hasVoted: userVotes.has(ss.id),
    canVote: voteLimits.showVotesRemaining > 0 && !userVotes.has(ss.id),
    song: {
      id: ss.song.id,
      name: ss.song.title || ss.song.name,
      album: ss.song.album || 'Unknown Album',
      duration_ms: ss.song.duration_ms || 180000, // Default 3 minutes
      spotify_url: ss.song.spotify_url
    }
  })) || []

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Show header with gradient */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-8 text-white">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-2">{show.artist.name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-white/90">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{show.venue.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(show.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            {show.ticketmaster_url && (
              <Link 
                href={show.ticketmaster_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-white/80 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Get Tickets</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        {/* Connection status */}
        {!isConnected && (
          <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-800/50 rounded-lg text-yellow-200">
            Connecting to live updates...
          </div>
        )}

        {/* Voting section */}
        <VotingSection
          songs={songs}
          onVote={handleVote}
          isLoading={isLoading}
          showId={params.id}
          voteLimits={voteLimits}
        />
      </div>

      {/* Live activity indicator */}
      <LiveActivityIndicator showId={params.id} />
    </div>
  )
}

// Loading skeleton
function ShowPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-950">
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-8">
        <div className="container mx-auto">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-48" />
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

// Live activity indicator component
function LiveActivityIndicator({ showId }: { showId: string }) {
  const [activeUsers, setActiveUsers] = useState(0)
  
  useEffect(() => {
    const channel = supabase.channel(`show:${showId}:presence`)
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        setActiveUsers(Object.keys(state).length)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() })
        }
      })
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [showId])

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 rounded-full px-4 py-2 flex items-center gap-2">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      <span className="text-sm">
        {activeUsers} {activeUsers === 1 ? 'person' : 'people'} voting now
      </span>
    </div>
  )
}
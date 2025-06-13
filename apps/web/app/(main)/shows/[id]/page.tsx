'use client'

import { useEffect, useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useGraphQLClient } from '@/lib/graphql-client'
import { GET_SHOW_WITH_SETLIST, GET_USER_VOTES, CAST_VOTE, GET_ARTIST_SONGS, ADD_SONG_TO_SETLIST } from '@/lib/graphql/queries'
import { useRealtimeVotes } from '@/hooks/useRealtimeVotes'
import { VotingSection } from '@/components/voting/VotingSection'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface Song { // Renamed from SetlistSong for clarity, or create a new one for catalog
  id: string
  title: string
  album?: string
}

interface SetlistSong {
  id: string
  position: number
  votes: number
  hasVoted: boolean
  canVote: boolean
  song: {
    id: string
    name: string
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
  const [selectedSongToAdd, setSelectedSongToAdd] = useState<Song | null>(null)

  // Fetch show data with songs
  const { data: showData, isLoading } = useQuery({
    queryKey: ['show', params.id],
    queryFn: async () => {
      return client.request(GET_SHOW_WITH_SETLIST, { id: params.id })
    }
  })

  const show = (showData as any)?.show

  // Fetch user's votes for this show
  const { data: userVotesData } = useQuery({
    queryKey: ['userVotes', params.id, user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const data = await client.request(GET_USER_VOTES, { showId: params.id })
      return (data as any).userVotes?.map((v: any) => v.setlist_song_id) || []
    },
    enabled: !!user?.id
  })

  // Update user votes state
  useEffect(() => {
    if (user && userVotesData) {
      setUserVotes(new Set(userVotesData))
      setVoteLimits(prev => ({
        ...prev,
        showVotesRemaining: Math.max(0, 10 - userVotesData.length)
      }))
    } else if (!user) {
      // Load votes from localStorage for non-logged-in users
      const voteKey = `setlist_votes_${params.id}`
      const existingVotes = JSON.parse(localStorage.getItem(voteKey) || '[]')
      setUserVotes(new Set(existingVotes))
      setVoteLimits({
        showVotesRemaining: Math.max(0, 3 - existingVotes.length),
        dailyVotesRemaining: Math.max(0, 3 - existingVotes.length)
      })
    }
  }, [userVotesData, user, params.id])

  // Set up vote mutation
  const voteMutation = useMutation({
    mutationFn: async ({ showId, setlistSongId }: { showId: string; setlistSongId: string }) => {
      return client.request(CAST_VOTE, { showId, setlistSongId })
    },
    onSuccess: (data) => {
      if ((data as any).castVote?.votesRemaining) {
        setVoteLimits({
          showVotesRemaining: (data as any).castVote.votesRemaining.show,
          dailyVotesRemaining: (data as any).castVote.votesRemaining.daily
        })
      }
    }
  })

  // Fetch artist's song catalog for "Add Song" dialog
  const { data: artistSongsData, isLoading: isLoadingArtistSongs } = useQuery({
    queryKey: ['artistSongs', show?.artist?.id],
    queryFn: async () => {
      if (!show?.artist?.id) return []
      try {
        const data = await client.request(GET_ARTIST_SONGS, { artistId: show.artist.id, limit: 1000 })
        return (data as any).songs?.edges?.map((edge: any) => edge.node) || []
      } catch (error) {
        console.error("Error fetching artist songs:", error)
        // Fallback to direct Supabase query
        const { data: songsFromDb, error: dbError } = await supabase
          .from('songs')
          .select('id, title, album')
          .eq('artist_id', show.artist.id)
        if (dbError) {
          console.error("Fallback error:", dbError)
          return []
        }
        return songsFromDb as Song[]
      }
    },
    enabled: !!show?.artist?.id,
  })

  const addSongMutation = useMutation({
    mutationFn: async ({ setlistId, songId, position }: { setlistId: string; songId: string; position: number }) => {
      try {
        const data = await client.request(ADD_SONG_TO_SETLIST, { 
          setlistId, 
          input: { songId, position } 
        })
        return (data as any).addSongToSetlist
      } catch (error) {
        console.error("GraphQL mutation failed, falling back to Supabase:", error)
        // Fallback to direct Supabase query
        const { data, error: dbError } = await supabase
          .from('setlist_songs')
          .insert([{ setlist_id: setlistId, song_id: songId, position: position, vote_count: 0 }])
          .select()
          .single()
        if (dbError) throw dbError
        return data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['show', params.id] }) // Refetch show data to update setlist
      setSelectedSongToAdd(null)
    },
    onError: (error) => {
      console.error("Error adding song:", error)
      alert("Failed to add song. It might already be in the setlist.") // Basic error handling
    }
  })

  const handleAddSongToSetlist = () => {
    if (!selectedSongToAdd || !show?.setlists?.[0]?.id) return;
    const currentSetlist = show.setlists[0];
    const newPosition = (currentSetlist.setlist_songs?.length || 0) + 1;
    
    addSongMutation.mutate({
      setlistId: currentSetlist.id,
      songId: selectedSongToAdd.id,
      position: newPosition
    })
  }


  // Handle voting - now supports non-logged-in users with localStorage tracking
  const handleVote = async (songId: string, setlistSongId: string) => {
    // Check if user is not logged in - use localStorage for vote tracking
    if (!user) {
      const voteKey = `setlist_votes_${params.id}`
      const existingVotes = JSON.parse(localStorage.getItem(voteKey) || '[]')
      
      // Check if user already voted (max 3 votes for non-logged-in users)
      if (existingVotes.length >= 3) {
        alert('You have used all 3 free votes. Sign in for unlimited voting!')
        return
      }
      
      // Check if already voted for this song
      if (existingVotes.includes(setlistSongId)) {
        alert('You have already voted for this song')
        return
      }
    }

    // Optimistic update
    optimisticVoteUpdate(setlistSongId)
    setUserVotes(prev => new Set([...prev, setlistSongId]))
    
    if (user) {
      setVoteLimits(prev => ({
        ...prev,
        showVotesRemaining: Math.max(0, prev.showVotesRemaining - 1)
      }))
    }

    try {
      // For non-logged-in users, update localStorage and call vote API
      if (!user) {
        const voteKey = `setlist_votes_${params.id}`
        const existingVotes = JSON.parse(localStorage.getItem(voteKey) || '[]')
        existingVotes.push(setlistSongId)
        localStorage.setItem(voteKey, JSON.stringify(existingVotes))
        
        // Update local vote limits for non-logged-in users
        setVoteLimits(prev => ({
          showVotesRemaining: Math.max(0, 3 - existingVotes.length),
          dailyVotesRemaining: Math.max(0, 3 - existingVotes.length)
        }))
      }

      // Call the vote API route - now works for both logged-in and non-logged-in users
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          songId,
          showId: params.id,
          setlistSongId,
          isAnonymous: !user
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to vote')
      }

      // Update vote limits from response for logged-in users
      if (user && data.votesRemaining) {
        setVoteLimits({
          showVotesRemaining: data.votesRemaining.show,
          dailyVotesRemaining: data.votesRemaining.daily
        })
      }

      // Refresh data
      if (user) {
        await queryClient.invalidateQueries({ queryKey: ['userVotes', params.id] })
      }
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
      
      if (!user) {
        // Revert localStorage for non-logged-in users
        const voteKey = `setlist_votes_${params.id}`
        const existingVotes = JSON.parse(localStorage.getItem(voteKey) || '[]')
        const updatedVotes = existingVotes.filter((id: string) => id !== setlistSongId)
        localStorage.setItem(voteKey, JSON.stringify(updatedVotes))
        
        setVoteLimits(prev => ({
          showVotesRemaining: Math.max(0, 3 - updatedVotes.length),
          dailyVotesRemaining: Math.max(0, 3 - updatedVotes.length)
        }))
      } else {
        setVoteLimits(prev => ({
          ...prev,
          showVotesRemaining: prev.showVotesRemaining + 1
        }))
      }
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
  const songs: SetlistSong[] = show?.setlists?.[0]?.setlistSongs?.map((ss: any) => ({
    id: ss.id,
    position: ss.position,
    votes: voteCounts[ss.id] || ss.voteCount || 0,
    hasVoted: userVotes.has(ss.id),
    canVote: voteLimits.showVotesRemaining > 0 && !userVotes.has(ss.id),
    song: {
      id: ss.song.id,
      name: ss.song.title || ss.song.name,
      album: ss.song.album || 'Unknown Album',
      duration_ms: ss.song.durationMs || 180000, // Default 3 minutes
      spotify_url: ss.song.spotifyUrl
    }
  })) || []

  return (
    <div className="min-h-screen bg-background">
      {/* Show header with gradient - inspired by artist page design */}
      <div className="bg-gradient-to-b from-background via-muted/30 to-[#122727] py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 sm:gap-8">
            {/* Artist Image */}
            <div className="flex-shrink-0">
              {show.artist.image_url ? (
                <img
                  src={show.artist.image_url}
                  alt={show.artist.name}
                  className="w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 rounded-full object-cover border-4 border-border shadow-strong"
                />
              ) : (
                <div className="w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 rounded-full bg-muted border-4 border-border flex items-center justify-center shadow-strong">
                  <span className="text-2xl sm:text-4xl lg:text-6xl font-headline font-bold gradient-text">
                    {show.artist.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Show Info */}
            <div className="flex-1 min-w-0 text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-headline font-bold mb-4 gradient-text leading-tight">
                {show.artist.name}
              </h1>
              
              <div className="flex flex-col sm:flex-row lg:flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 mb-6 sm:mb-8 text-base sm:text-lg text-muted-foreground font-body">
                <div className="flex items-center gap-2 sm:gap-3">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                  <span className="font-medium text-center lg:text-left">
                    {show.venue.name}, {show.venue.city}
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                  <span className="font-medium text-center lg:text-left text-sm sm:text-base">
                    {new Date(show.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              
                
                {show.ticketmaster_url && (
                  <Link
                    href={show.ticketmaster_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-black flex items-center justify-center gap-3 px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base"
                  >
                    <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Get Tickets</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="bg-slate-950/50 min-h-screen">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Connection status */}
        {!isConnected && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 glass border border-yellow-500/30 rounded-xl text-yellow-400 font-body text-sm sm:text-base">
            Connecting to live updates...
          </div>
        )}

        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-headline font-bold gradient-text">Setlist Voting</h2>
        </div>

        {/* Voting section */}
        <VotingSection
          songs={songs}
          onVote={handleVote}
          isLoading={isLoading}
          showId={params.id}
          voteLimits={voteLimits}
          artistSongs={artistSongsData}
          selectedSongToAdd={selectedSongToAdd}
          onSongSelect={setSelectedSongToAdd}
          onAddSong={handleAddSongToSetlist}
          isAddingSong={addSongMutation.isPending}
          user={user}
          showData={show}
        />
        </div>
      </div>

      {/* Live activity indicator */}
      <LiveActivityIndicator showId={params.id} />
    </div>
  )
}

// Loading skeleton
function ShowPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-b from-background via-muted/30 to-[#122727] py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 sm:gap-8">
            {/* Artist Image Skeleton */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 rounded-full bg-muted border-4 border-border animate-pulse" />
            </div>
            
            {/* Show Info Skeleton */}
            <div className="flex-1 min-w-0 text-center lg:text-left">
              <div className="h-12 sm:h-16 w-full max-w-96 bg-muted rounded-lg mb-4 animate-pulse mx-auto lg:mx-0" />
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-6 sm:mb-8 justify-center lg:justify-start">
                <div className="h-6 w-48 bg-muted rounded-lg animate-pulse mx-auto lg:mx-0" />
                <div className="h-6 w-56 bg-muted rounded-lg animate-pulse mx-auto lg:mx-0" />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                <div className="h-12 w-40 bg-muted rounded-xl animate-pulse mx-auto lg:mx-0" />
                <div className="h-12 w-32 bg-muted rounded-xl animate-pulse mx-auto lg:mx-0" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 w-full bg-muted rounded-2xl animate-pulse" />
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
    <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 glass px-3 sm:px-6 py-2 sm:py-3 flex items-center gap-2 sm:gap-3 border border-border">
      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse" />
      <span className="text-xs sm:text-sm font-body font-medium text-foreground">
        {activeUsers} {activeUsers === 1 ? 'person' : 'people'} voting now
      </span>
    </div>
  )
}
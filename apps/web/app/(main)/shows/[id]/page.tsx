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
        const data = await client.request(GET_ARTIST_SONGS, { artistId: show.artist.id, limit: 500 })
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
      <div className="bg-gradient-to-b from-background via-muted/30 to-background py-16 px-4">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex items-start gap-8">
            {/* Artist Image */}
            <div className="flex-shrink-0">
              {show.artist.image_url ? (
                <img
                  src={show.artist.image_url}
                  alt={show.artist.name}
                  className="w-64 h-64 rounded-full object-cover border-4 border-border shadow-strong"
                />
              ) : (
                <div className="w-64 h-64 rounded-full bg-muted border-4 border-border flex items-center justify-center shadow-strong">
                  <span className="text-6xl font-headline font-bold gradient-text">
                    {show.artist.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Show Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-6xl font-headline font-bold mb-4 gradient-text leading-tight">
                {show.artist.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-6 mb-8 text-lg text-muted-foreground font-body">
                <div className="flex items-center gap-3">
                  <MapPin className="w-6 h-6 text-primary" />
                  <span className="font-medium">{show.venue.name}, {show.venue.city}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-primary" />
                  <span className="font-medium">
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
              <div className="flex flex-wrap gap-4">
                <button className="btn-white flex items-center gap-3 px-8 py-4">
                  <span>Vote on Setlist</span>
                </button>
                
                {show.ticketmaster_url && (
                  <Link
                    href={show.ticketmaster_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-black flex items-center gap-3 px-8 py-4"
                  >
                    <ExternalLink className="w-5 h-5" />
                    <span>Get Tickets</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="w-full max-w-7xl mx-auto px-4 py-12">
        {/* Connection status */}
        {!isConnected && (
          <div className="mb-6 p-4 glass border border-yellow-500/30 rounded-xl text-yellow-400 font-body">
            Connecting to live updates...
          </div>
        )}

        <div className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <h2 className="text-4xl font-headline font-bold gradient-text">Setlist Voting</h2>
          {show?.setlists?.[0]?.id && user && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <select
                className="bg-input border border-border text-foreground px-4 py-3 rounded-xl font-body w-full sm:w-64 focus:outline-none focus:border-primary transition-colors"
                value={selectedSongToAdd?.id || ''}
                onChange={(e) => {
                  const song = artistSongsData?.find((s: any) => s.id === e.target.value) || null
                  setSelectedSongToAdd(song)
                }}
              >
                <option value="">Select a song</option>
                {artistSongsData?.slice().sort((a: any, b: any) => a.title.localeCompare(b.title)).map((song: any) => (
                  <option key={song.id} value={song.id}>{song.title}</option>
                ))}
              </select>
              <button
                onClick={handleAddSongToSetlist}
                disabled={!selectedSongToAdd || addSongMutation.isPending}
                className="btn-black px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
              >
                {addSongMutation.isPending ? 'Adding...' : 'Add to Setlist'}
              </button>
            </div>
          )}
        </div>

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
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-b from-background via-muted/30 to-background py-16 px-4">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex items-start gap-8">
            {/* Artist Image Skeleton */}
            <div className="flex-shrink-0">
              <div className="w-64 h-64 rounded-full bg-muted border-4 border-border animate-pulse" />
            </div>
            
            {/* Show Info Skeleton */}
            <div className="flex-1 min-w-0">
              <div className="h-16 w-96 bg-muted rounded-lg mb-4 animate-pulse" />
              <div className="flex gap-6 mb-8">
                <div className="h-6 w-48 bg-muted rounded-lg animate-pulse" />
                <div className="h-6 w-56 bg-muted rounded-lg animate-pulse" />
              </div>
              <div className="flex gap-4">
                <div className="h-12 w-40 bg-muted rounded-xl animate-pulse" />
                <div className="h-12 w-32 bg-muted rounded-xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full max-w-7xl mx-auto px-4 py-12">
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
    <div className="fixed bottom-6 right-6 glass px-6 py-3 flex items-center gap-3 border border-border">
      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
      <span className="text-sm font-body font-medium text-foreground">
        {activeUsers} {activeUsers === 1 ? 'person' : 'people'} voting now
      </span>
    </div>
  )
}
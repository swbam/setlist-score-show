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
import { Button } from '@/components/ui/button' // Added
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog" // Added
import { Input } from "@/components/ui/input" // Added
import { PlusCircle, Calendar, MapPin, Users, ExternalLink } from 'lucide-react' // Added PlusCircle
import Link from 'next/link'

interface Song { // Renamed from SetlistSong for clarity, or create a new one for catalog
  id: string
  title: string
  album?: string
}

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
  const [isAddSongDialogOpen, setIsAddSongDialogOpen] = useState(false)
  const [songSearchTerm, setSongSearchTerm] = useState('')
  const [selectedSongToAdd, setSelectedSongToAdd] = useState<Song | null>(null)

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

  // Fetch artist's song catalog for "Add Song" dialog
  const { data: artistSongsData, isLoading: isLoadingArtistSongs } = useQuery({
    queryKey: ['artistSongs', show?.artist?.id],
    queryFn: async () => {
      if (!show?.artist?.id) return []
      // TODO: Replace with actual GraphQL query for songs by artistId
      // For now, using a placeholder. This should call the 'songs' query with artistId filter.
      // const data = await client.request(GET_ARTIST_SONGS_QUERY, { artistId: show.artist.id })
      // return data.artistSongs || []
      // Placeholder:
      const { data: songsFromDb, error } = await supabase
        .from('songs')
        .select('id, title, album')
        .eq('artist_id', show.artist.id)
      if (error) {
        console.error("Error fetching artist songs:", error)
        return []
      }
      return songsFromDb as Song[]
    },
    enabled: !!show?.artist?.id && isAddSongDialogOpen, // Only fetch when dialog is open and artistId is available
  })

  const addSongMutation = useMutation({
    mutationFn: async ({ setlistId, songId, position }: { setlistId: string; songId: string; position: number }) => {
      // TODO: Replace with actual GraphQL mutation 'addSongToSetlist'
      // return client.request(ADD_SONG_TO_SETLIST_MUTATION, { setlistId, songId, position })
      // Placeholder:
      const { data, error } = await supabase
        .from('setlist_songs')
        .insert([{ setlist_id: setlistId, song_id: songId, position: position, vote_count: 0 }])
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['show', params.id] }) // Refetch show data to update setlist
      setIsAddSongDialogOpen(false)
      setSelectedSongToAdd(null)
      setSongSearchTerm('')
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

        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-3xl font-bold gradient-text">Setlist Voting</h2>
          {show?.setlists?.[0]?.id && user && (
            <Dialog open={isAddSongDialogOpen} onOpenChange={setIsAddSongDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gradient-border text-teal-400 hover:text-teal-300">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Song
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-800">
                <DialogHeader>
                  <DialogTitle className="gradient-text">Add Song to Setlist</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Input
                    placeholder="Search songs..."
                    value={songSearchTerm}
                    onChange={(e) => setSongSearchTerm(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {isLoadingArtistSongs && <p className="text-gray-400">Loading songs...</p>}
                    {artistSongsData?.filter(song => song.title.toLowerCase().includes(songSearchTerm.toLowerCase()))
                      .map(song => (
                        <div
                          key={song.id}
                          onClick={() => setSelectedSongToAdd(song)}
                          className={`p-2 rounded cursor-pointer hover:bg-gray-700 ${selectedSongToAdd?.id === song.id ? 'bg-teal-600 text-white' : 'text-gray-300'}`}
                        >
                          <p className="font-medium">{song.title}</p>
                          {song.album && <p className="text-xs text-gray-500">{song.album}</p>}
                        </div>
                      ))}
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="ghost">Cancel</Button>
                  </DialogClose>
                  <Button
                    onClick={handleAddSongToSetlist}
                    disabled={!selectedSongToAdd || addSongMutation.isPending}
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
                  >
                    {addSongMutation.isPending ? 'Adding...' : 'Add Song'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
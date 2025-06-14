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
      const limit = 1000
      let offset = 0
      let allSongs: Song[] = []

      // Helper to merge songs uniquely by id
      const mergeUnique = (base: Song[], incoming: Song[]) => {
        const existingIds = new Set(base.map((s) => s.id))
        return [...base, ...incoming.filter((s) => !existingIds.has(s.id))]
      }

      try {
        // Paginate through GraphQL results until fewer than limit returned
        while (true) {
          const gData = await client.request(GET_ARTIST_SONGS, { artistId: show.artist.id, limit, offset })
          const batch: Song[] = (gData as any)?.songs?.edges?.map((edge: any) => edge.node) || []
          allSongs = mergeUnique(allSongs, batch)
          if (batch.length < limit) break
          offset += limit
        }
      } catch (error) {
        console.error("GraphQL song catalog fetch failed:", error)
      }

      // Fallback / merge with Supabase data
      try {
        const { data: songsFromDb, error: dbError } = await supabase
          .from('songs')
          .select('id, title, album')
          .eq('artist_id', show.artist.id)
        if (dbError) throw dbError
        if (songsFromDb) {
          allSongs = mergeUnique(allSongs, songsFromDb as Song[])
        }
      } catch (err) {
        console.error('Supabase song fallback failed:', err)
      }

      // Sort alphabetically
      return allSongs.sort((a, b) => a.title.localeCompare(b.title))
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
      {/* Show header */}
      <div className="bg-gradient-to-b from-black to-neutral-800 py-6 sm:py-10 lg:py-12 px-4">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 lg:gap-8">
            {/* Artist Image - Left aligned */}
            <div className="flex-shrink-0">
              {show.artist.image_url ? (
                <img
                  src={show.artist.image_url}
                  alt={show.artist.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-border shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted flex items-center justify-center border-2 border-border shadow-lg">
                  <span className="text-xl sm:text-2xl font-headline font-bold text-muted-foreground">
                    {show.artist.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Event Info - Right side */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-headline font-bold mb-1 sm:mb-2 text-white">
                {show.artist.name}
              </h1>
              
              {show.title && (
                <p className="text-base sm:text-lg lg:text-xl text-gray-300 font-medium mb-3 sm:mb-4">
                  {show.title}
                </p>
              )}
              
              <div className="space-y-1 sm:space-y-2 text-sm sm:text-base text-gray-400 font-body">
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" />
                  <span className="font-medium">{show.venue.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" />
                  <span className="font-medium">
                    {new Date(show.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="text-gray-500 pl-7 sm:pl-8">
                  {show.venue.city}, {show.venue.state || show.venue.country}
                </div>
              </div>

              {/* Action Button */}
              {show.ticketmaster_url && (
                <div className="mt-5 sm:mt-6">
                  <Link
                    href={show.ticketmaster_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white text-black px-5 py-2 rounded-md text-sm font-semibold hover:bg-gray-200 transition-colors shadow"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Get Tickets</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="bg-background min-h-screen">
        <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-headline font-bold text-foreground">Setlist Voting</h2>
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
    </div>
  )
}

// Loading skeleton
function ShowPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton with green gradient */}
      <div className="bg-gradient-to-b from-background via-muted/30 to-[#122727] py-8 sm:py-12 lg:py-16 px-4">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 lg:gap-8">
            <div className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-full bg-muted border-4 border-border animate-pulse flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="h-12 sm:h-16 lg:h-20 bg-muted rounded-lg mb-4 animate-pulse w-3/4" />
              <div className="h-6 sm:h-8 bg-muted rounded-lg mb-6 animate-pulse w-1/2" />
              <div className="space-y-3">
                <div className="h-6 bg-muted rounded-lg animate-pulse w-2/3" />
                <div className="h-6 bg-muted rounded-lg animate-pulse w-1/2" />
                <div className="h-5 bg-muted rounded-lg animate-pulse w-1/3" />
              </div>
              <div className="h-12 w-32 bg-muted rounded-lg animate-pulse mt-8" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Content Skeleton */}
      <div className="bg-background">
        <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:py-8">
          <div className="h-8 bg-muted rounded-lg animate-pulse mb-8 w-48" />
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 w-full bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { ArrowUp, Plus, Music, Loader2, Users, Star } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SetlistSong {
  id: string
  song_id: string
  position: number
  vote_count: number
  hasVoted?: boolean
  song: {
    id: string
    title: string
    album?: string
    popularity?: number
  }
}

interface VotingSectionProps {
  showId: string
  setlistId: string
  className?: string
}

export function VotingSection({ showId, setlistId, className }: VotingSectionProps) {
  const { user } = useAuth()
  const [songs, setSongs] = useState<SetlistSong[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isVoting, setIsVoting] = useState<string | null>(null)
  const [totalVotes, setTotalVotes] = useState(0)
  const [uniqueVoters, setUniqueVoters] = useState(0)
  const realtimeRef = useRef<any>(null)

  // Load initial setlist data
  useEffect(() => {
    loadSetlistData()
  }, [setlistId, user])

  // Setup real-time subscription
  useEffect(() => {
    if (!setlistId) return

    // Subscribe to setlist song changes
    const channel = supabase
      .channel(`setlist:${setlistId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'setlist_songs',
          filter: `setlist_id=eq.${setlistId}`
        },
        (payload) => {
          handleRealtimeUpdate(payload)
        }
      )
      .subscribe()

    realtimeRef.current = channel

    return () => {
      if (realtimeRef.current) {
        supabase.removeChannel(realtimeRef.current)
      }
    }
  }, [setlistId])

  const loadSetlistData = async () => {
    try {
      setIsLoading(true)
      
      // Get setlist songs with vote information
      const { data: setlistData, error } = await supabase
        .from('setlist_songs')
        .select(`
          id,
          song_id,
          position,
          vote_count,
          songs (
            id,
            title,
            album,
            popularity
          )
        `)
        .eq('setlist_id', setlistId)
        .order('vote_count', { ascending: false })
        .order('position', { ascending: true })

      if (error) throw error

      let enrichedSongs: SetlistSong[] = []
      
      if (setlistData) {
        // Check which songs the current user has voted for
        if (user) {
          const songIds = setlistData.map(s => s.id)
          const { data: userVotes } = await supabase
            .from('votes')
            .select('setlist_song_id')
            .eq('user_id', user.id)
            .in('setlist_song_id', songIds)

          const votedSongIds = new Set(userVotes?.map(v => v.setlist_song_id) || [])

          enrichedSongs = setlistData.map(song => ({
            ...song,
            song: song.songs as any,
            hasVoted: votedSongIds.has(song.id)
          }))
        } else {
          enrichedSongs = setlistData.map(song => ({
            ...song,
            song: song.songs as any,
            hasVoted: false
          }))
        }
      }

      setSongs(enrichedSongs)
      
      // Calculate totals
      const total = enrichedSongs.reduce((sum, song) => sum + song.vote_count, 0)
      setTotalVotes(total)
      
      // Get unique voters count
      const { count } = await supabase
        .from('votes')
        .select('user_id', { count: 'exact' })
        .in('setlist_song_id', enrichedSongs.map(s => s.id))

      setUniqueVoters(count || 0)

    } catch (error) {
      console.error('Error loading setlist:', error)
      toast.error('Failed to load setlist data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRealtimeUpdate = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    setSongs(currentSongs => {
      const updated = [...currentSongs]

      if (eventType === 'UPDATE' && newRecord) {
        const index = updated.findIndex(s => s.id === newRecord.id)
        if (index !== -1) {
          updated[index] = {
            ...updated[index],
            vote_count: newRecord.vote_count
          }
          
          // Re-sort by vote count
          updated.sort((a, b) => {
            if (b.vote_count !== a.vote_count) {
              return b.vote_count - a.vote_count
            }
            return a.position - b.position
          })
        }
      }

      return updated
    })

    // Update total votes
    if (newRecord && oldRecord) {
      const voteDiff = newRecord.vote_count - oldRecord.vote_count
      setTotalVotes(prev => prev + voteDiff)
    }
  }

  const handleVote = async (setlistSongId: string) => {
    if (!user) {
      toast.error('Please sign in to vote')
      return
    }

    if (isVoting) return

    const songToUpdate = songs.find(s => s.id === setlistSongId)
    if (!songToUpdate) return

    if (songToUpdate.hasVoted) {
      toast.info('You\'ve already voted for this song')
      return
    }

    setIsVoting(setlistSongId)

    // Optimistic update
    setSongs(currentSongs => 
      currentSongs.map(song => 
        song.id === setlistSongId 
          ? { ...song, vote_count: song.vote_count + 1, hasVoted: true }
          : song
      )
    )
    setTotalVotes(prev => prev + 1)

    try {
      // Call the vote function
      const { error } = await supabase.rpc('vote_for_song', {
        setlist_song_id: setlistSongId,
        user_id: user.id
      })

      if (error) throw error

      toast.success('Vote cast successfully!', {
        duration: 2000,
      })

    } catch (error: any) {
      console.error('Vote error:', error)
      
      // Revert optimistic update
      setSongs(currentSongs => 
        currentSongs.map(song => 
          song.id === setlistSongId 
            ? { ...song, vote_count: song.vote_count - 1, hasVoted: false }
            : song
        )
      )
      setTotalVotes(prev => prev - 1)

      if (error.message?.includes('already voted')) {
        toast.error('You\'ve already voted for this song')
      } else {
        toast.error('Failed to cast vote. Please try again.')
      }
    } finally {
      setIsVoting(null)
    }
  }

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-white/60 mx-auto mb-4" />
          <p className="text-white/60">Loading setlist...</p>
        </div>
      </div>
    )
  }

  if (!songs.length) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="text-center py-12">
          <Music className="w-12 h-12 text-white/40 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No setlist yet</h3>
          <p className="text-white/60 mb-6">Be the first to start building this setlist!</p>
          <button className="px-6 py-3 bg-white text-black rounded-sm font-semibold hover:bg-gray-100 transition-all">
            Add Songs
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Stats Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-6 bg-white/5 backdrop-blur-xl rounded-lg border border-white/10">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Fan Setlist</h2>
          <p className="text-white/60 text-sm sm:text-base">Vote for the songs you want to hear live</p>
        </div>
        <div className="flex items-center gap-4 sm:gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-white font-semibold">{totalVotes}</span>
            <span className="text-white/60">votes</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="text-white font-semibold">{uniqueVoters}</span>
            <span className="text-white/60">fans</span>
          </div>
        </div>
      </div>

      {/* Setlist Songs */}
      <div className="space-y-3">
        {songs.map((song, index) => (
          <div
            key={song.id}
            className="group relative bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-xl rounded-lg border border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden"
          >
            {/* Vote count indicator */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-red-500" 
                 style={{ 
                   opacity: totalVotes > 0 ? Math.max(0.3, song.vote_count / Math.max(...songs.map(s => s.vote_count))) : 0.3 
                 }} 
            />
            
            <div className="flex items-center gap-4 p-4 sm:p-6">
              {/* Position */}
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-sm sm:text-base font-bold text-white">
                  {index + 1}
                </span>
              </div>

              {/* Song Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-sm sm:text-base mb-1 truncate group-hover:text-gray-200 transition-colors">
                  {song.song.title}
                </h3>
                {song.song.album && (
                  <p className="text-xs sm:text-sm text-white/60 truncate">
                    {song.song.album}
                  </p>
                )}
              </div>

              {/* Vote Count */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="text-right">
                  <div className="text-lg sm:text-xl font-bold text-white">
                    {song.vote_count}
                  </div>
                  <div className="text-xs text-white/60">
                    {song.vote_count === 1 ? 'vote' : 'votes'}
                  </div>
                </div>

                {/* Vote Button */}
                <button
                  onClick={() => handleVote(song.id)}
                  disabled={!user || song.hasVoted || isVoting === song.id}
                  className={cn(
                    "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                    song.hasVoted 
                      ? "bg-green-500/20 border-green-500/50 text-green-400 cursor-not-allowed"
                      : user
                        ? "bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/40 text-white hover:scale-110 active:scale-95"
                        : "bg-white/5 border-white/10 text-white/40 cursor-not-allowed",
                    isVoting === song.id && "animate-pulse"
                  )}
                  title={
                    !user 
                      ? "Sign in to vote" 
                      : song.hasVoted 
                        ? "Already voted" 
                        : "Vote for this song"
                  }
                >
                  {isVoting === song.id ? (
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  ) : song.hasVoted ? (
                    <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                  ) : (
                    <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Songs CTA */}
      <div className="text-center p-6 bg-white/5 backdrop-blur-xl rounded-lg border border-white/10 border-dashed">
        <Plus className="w-8 h-8 text-white/40 mx-auto mb-3" />
        <p className="text-white/60 mb-4 text-sm sm:text-base">Want to add more songs to the setlist?</p>
        <button className="px-4 sm:px-6 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-sm text-white font-semibold hover:bg-white/20 transition-all text-sm sm:text-base">
          Browse Artist Catalog
        </button>
      </div>

      {/* Login CTA for anonymous users */}
      {!user && (
        <div className="text-center p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-xl rounded-lg border border-blue-500/20">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/20 mb-4">
            <Users className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Join the voting!</h3>
          <p className="text-white/70 mb-4 text-sm sm:text-base">Sign in to vote for your favorite songs and help shape this setlist</p>
          <button className="px-6 py-3 bg-white text-black rounded-sm font-semibold hover:bg-gray-100 transition-all">
            Sign In to Vote
          </button>
        </div>
      )}
    </div>
  )
}
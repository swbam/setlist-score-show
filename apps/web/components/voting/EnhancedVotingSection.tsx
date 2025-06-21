'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { VoteButton } from './VoteButton'
import { motion, AnimatePresence } from 'framer-motion'
import { Music, Users, Clock, Trophy } from 'lucide-react'
import confetti from 'canvas-confetti'

interface Song {
  id: string
  title: string
  album?: string
  duration?: number
  spotify_url?: string
}

interface SetlistSong {
  song: Song
  vote_count: number
  position?: number
}

interface Show {
  id: string
  name: string
  date: string
  artist: {
    id: string
    name: string
    image_url?: string
  }
  venue: {
    id: string
    name: string
    city: string
    state: string
  }
}

interface Setlist {
  id: string
  show_id: string
  setlist_songs: SetlistSong[]
}

interface EnhancedVotingSectionProps {
  show: Show
  setlist: Setlist
}

export function EnhancedVotingSection({ show, setlist }: EnhancedVotingSectionProps) {
  const { user } = useAuth()
  const [votes, setVotes] = useState<Record<string, number>>({})
  const [userVotes, setUserVotes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sortBy, setSortBy] = useState<'votes' | 'alphabetical' | 'album'>('votes')
  const [showConfetti, setShowConfetti] = useState(false)

  // Initialize vote counts
  useEffect(() => {
    const initialVotes: Record<string, number> = {}
    setlist.setlist_songs.forEach(({ song, vote_count }) => {
      initialVotes[song.id] = vote_count
    })
    setVotes(initialVotes)
  }, [setlist])

  // Get user's existing votes
  useEffect(() => {
    if (!user) return

    const fetchUserVotes = async () => {
      const { data } = await supabase
        .from('votes')
        .select('setlist_song_id, setlist_songs!inner(song_id)')
        .eq('user_id', user.id)
        .eq('setlist_songs.setlist_id', setlist.id)

      if (data) {
        const songIds = data.map(vote => vote.setlist_songs.song_id)
        setUserVotes(songIds)
      }
    }

    fetchUserVotes()
  }, [user, setlist.id])

  // Real-time vote updates
  useEffect(() => {
    const channel = supabase
      .channel(`setlist-${setlist.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'setlist_songs',
        filter: `setlist_id=eq.${setlist.id}`
      }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setVotes(prev => ({
            ...prev,
            [payload.new.song_id]: payload.new.vote_count
          }))
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [setlist.id])

  const handleVote = async (songId: string) => {
    if (!user || userVotes.includes(songId) || userVotes.length >= 10) return

    setIsLoading(true)

    // Optimistic update
    setUserVotes(prev => [...prev, songId])
    setVotes(prev => ({ ...prev, [songId]: (prev[songId] || 0) + 1 }))

    try {
      const { error } = await supabase.rpc('vote_for_song', {
        p_setlist_id: setlist.id,
        p_song_id: songId,
        p_user_id: user.id
      })

      if (error) throw error

      // Show confetti if user hits 10 votes
      if (userVotes.length === 9) {
        setShowConfetti(true)
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        })
        setTimeout(() => setShowConfetti(false), 3000)
      }
    } catch (error) {
      console.error('Vote failed:', error)
      // Revert optimistic update
      setUserVotes(prev => prev.filter(id => id !== songId))
      setVotes(prev => ({ ...prev, [songId]: Math.max(0, (prev[songId] || 1) - 1) }))
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveVote = async (songId: string) => {
    if (!user || !userVotes.includes(songId)) return

    setIsLoading(true)

    // Optimistic update
    setUserVotes(prev => prev.filter(id => id !== songId))
    setVotes(prev => ({ ...prev, [songId]: Math.max(0, (prev[songId] || 1) - 1) }))

    try {
      const { error } = await supabase.rpc('remove_vote_for_song', {
        p_setlist_id: setlist.id,
        p_song_id: songId,
        p_user_id: user.id
      })

      if (error) throw error
    } catch (error) {
      console.error('Remove vote failed:', error)
      // Revert optimistic update
      setUserVotes(prev => [...prev, songId])
      setVotes(prev => ({ ...prev, [songId]: (prev[songId] || 0) + 1 }))
    } finally {
      setIsLoading(false)
    }
  }

  const sortedSongs = [...setlist.setlist_songs].sort((a, b) => {
    switch (sortBy) {
      case 'votes':
        return (votes[b.song.id] || b.vote_count) - (votes[a.song.id] || a.vote_count)
      case 'alphabetical':
        return a.song.title.localeCompare(b.song.title)
      case 'album':
        return (a.song.album || '').localeCompare(b.song.album || '')
      default:
        return 0
    }
  })

  const totalVotes = Object.values(votes).reduce((sum, count) => sum + count, 0)
  const daysUntilShow = Math.ceil((new Date(show.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-teal-200 dark:border-teal-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Vote for Songs</h2>
            <p className="text-gray-600 dark:text-gray-400">Help shape the setlist for this show</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-teal-600">{userVotes.length}/10</div>
            <div className="text-sm text-gray-500">votes used</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-lg font-semibold">{totalVotes}</span>
            </div>
            <div className="text-xs text-gray-500">Total Votes</div>
          </div>
          <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Music className="w-4 h-4 text-gray-500" />
              <span className="text-lg font-semibold">{setlist.setlist_songs.length}</span>
            </div>
            <div className="text-xs text-gray-500">Songs</div>
          </div>
          <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-lg font-semibold">{daysUntilShow}</span>
            </div>
            <div className="text-xs text-gray-500">Days Until</div>
          </div>
          <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="w-4 h-4 text-gray-500" />
              <span className="text-lg font-semibold">#{Math.max(1, sortedSongs.findIndex(s => userVotes.includes(s.song.id)) + 1)}</span>
            </div>
            <div className="text-xs text-gray-500">Top Vote</div>
          </div>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
        <div className="flex gap-2">
          {[
            { key: 'votes', label: 'Most Voted' },
            { key: 'alphabetical', label: 'A-Z' },
            { key: 'album', label: 'Album' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortBy(key as any)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                sortBy === key
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Songs List */}
      <div className="space-y-3">
        <AnimatePresence>
          {sortedSongs.map((setlistSong, index) => {
            const { song } = setlistSong
            const voteCount = votes[song.id] || setlistSong.vote_count
            const hasVoted = userVotes.includes(song.id)
            const canVote = user && !hasVoted && userVotes.length < 10

            return (
              <motion.div
                key={song.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                  hasVoted
                    ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{song.title}</h3>
                    {song.album && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{song.album}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-teal-600">{voteCount}</div>
                    <div className="text-xs text-gray-500">votes</div>
                  </div>
                  
                  <VoteButton
                    onClick={() => hasVoted ? handleRemoveVote(song.id) : handleVote(song.id)}
                    disabled={!user || isLoading || (!hasVoted && !canVote)}
                    voted={hasVoted}
                    loading={isLoading}
                  />
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Login Prompt */}
      {!user && (
        <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Join the Vote!</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Sign in to vote for songs and help shape this setlist
          </p>
          <a
            href="/login"
            className="inline-flex items-center px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
          >
            Sign In to Vote
          </a>
        </div>
      )}

      {/* Confetti Message */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="text-4xl mb-2">🎉</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  All votes used!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Thanks for helping shape this show!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 
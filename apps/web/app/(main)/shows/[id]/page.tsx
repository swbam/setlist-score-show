// app/(main)/shows/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRealtimeVotes } from '@/hooks/useRealtimeVotes'
import { VoteButton } from '@/components/voting/VoteButton'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

export default function ShowPage({ params }: { params: { id: string } }) {
  const queryClient = useQueryClient()
  const { latestUpdate } = useRealtimeVotes(params.id)
  const [votedSongs, setVotedSongs] = useState<Set<string>>(new Set())

  // Fetch show data with songs
  const { data: show, isLoading } = useQuery({
    queryKey: ['show', params.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shows')
        .select(`
          *,
          artist:artists(*),
          venue:venues(*),
          setlists(
            *,
            setlist_songs(
              *,
              song:songs(*)
            )
          )
        `)
        .eq('id', params.id)
        .single()
      
      if (error) throw error
      return data
    }
  })

  // Update local state when realtime update comes in
  useEffect(() => {
    if (latestUpdate) {
      // Update the query cache with new vote count
      queryClient.setQueryData(['show', params.id], (oldData: any) => {
        if (!oldData) return oldData
        
        return {
          ...oldData,
          setlists: oldData.setlists.map((setlist: any) => ({
            ...setlist,
            setlist_songs: setlist.setlist_songs.map((ss: any) => 
              ss.id === latestUpdate.setlistSongId
                ? { ...ss, vote_count: latestUpdate.newVoteCount }
                : ss
            )
          }))
        }
      })
      
      // Show a toast or animation for the update
      showVoteAnimation(latestUpdate)
    }
  }, [latestUpdate, queryClient, params.id])

  if (isLoading) return <ShowPageSkeleton />

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Show header with gradient */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">{show.artist.name}</h1>
        <p className="text-xl opacity-90">{show.venue.name}</p>
        <p className="opacity-80">
          {new Date(show.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {/* Voting section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Vote for Songs</h2>
          <div className="text-sm text-gray-500">
            {votedSongs.size}/10 votes used
          </div>
        </div>

        <AnimatePresence>
          {show.setlists[0]?.setlist_songs
            .sort((a, b) => b.vote_count - a.vote_count)
            .map((setlistSong, index) => (
              <motion.div
                key={setlistSong.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-gray-900 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-gray-600">
                    #{index + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {setlistSong.song.title}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {setlistSong.song.album}
                    </p>
                  </div>
                </div>
                
                <VoteButton
                  songId={setlistSong.song.id}
                  showId={params.id}
                  currentVotes={setlistSong.vote_count}
                  hasVoted={votedSongs.has(setlistSong.id)}
                  position={index + 1}
                />
              </motion.div>
            ))}
        </AnimatePresence>
      </div>

      {/* Live activity indicator */}
      <LiveActivityIndicator showId={params.id} />
    </div>
  )
}

// Component to show live voting activity
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
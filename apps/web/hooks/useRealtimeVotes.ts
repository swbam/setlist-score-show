import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface VoteUpdate {
  setlist_song_id: string
  vote_count: number
  user_id?: string
}

interface SetlistSongVotes {
  [setlistSongId: string]: number
}

export function useRealtimeVotes(showId: string | null) {
  const [voteCounts, setVoteCounts] = useState<SetlistSongVotes>({})
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const isSubscribedRef = useRef(false)
  const componentMountedRef = useRef(true)
  const queryClient = useQueryClient()

  // Initialize vote counts from database
  const initializeVoteCounts = useCallback(async () => {
    if (!showId) return

    try {
      const { data: setlists } = await supabase
        .from('setlists')
        .select('id')
        .eq('show_id', showId)

      if (!setlists?.length) return

      const { data, error } = await supabase
        .from('setlist_songs')
        .select('id, vote_count')
        .in('setlist_id', setlists.map(s => s.id))

      if (error) throw error

      const counts: SetlistSongVotes = {}
      data?.forEach(song => {
        counts[song.id] = song.vote_count
      })
      
      setVoteCounts(counts)
    } catch (error) {
      console.error('Error initializing vote counts:', error)
    }
  }, [showId])

  // Handle incoming vote updates
  const handleVoteUpdate = useCallback(async (payload: any) => {
    if (!componentMountedRef.current) return
    
    const update = payload.new as VoteUpdate
    
    // Update local vote count
    setVoteCounts(prev => {
      if (!componentMountedRef.current) return prev
      return {
        ...prev,
        [update.setlist_song_id]: update.vote_count
      }
    })

    // Invalidate React Query cache
    queryClient.invalidateQueries({ queryKey: ['show', showId] })

    // Show toast for other users' votes
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (componentMountedRef.current && update.user_id && update.user_id !== user?.id) {
        toast.success('New vote!', {
          description: 'Someone just voted for a song',
          duration: 2000,
        })
      }
    } catch (error) {
      console.error('Error checking user in vote update:', error)
    }
  }, [showId, queryClient])

  // Set up realtime subscription
  useEffect(() => {
    componentMountedRef.current = true
    
    if (!showId) {
      if (channelRef.current && isSubscribedRef.current) {
        try {
          supabase.removeChannel(channelRef.current)
        } catch (error) {
          console.error('Error removing channel:', error)
        }
        channelRef.current = null
        isSubscribedRef.current = false
      }
      setIsConnected(false)
      setVoteCounts({})
      return
    }

    // Initialize counts
    initializeVoteCounts()

    // Get setlist IDs for this show
    const setupChannel = async () => {
      const { data: setlists } = await supabase
        .from('setlists')
        .select('id')
        .eq('show_id', showId)

      if (!setlists?.length) return

      const channelName = `show-votes-${showId}-${Date.now()}`
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'setlist_songs',
            filter: `setlist_id=in.(${setlists.map(s => s.id).join(',')})`
          },
          handleVoteUpdate
        )
        .subscribe((status) => {
          if (!componentMountedRef.current) return
          
          setIsConnected(status === 'SUBSCRIBED')
          isSubscribedRef.current = status === 'SUBSCRIBED'
          
          if (status === 'SUBSCRIBED') {
            console.log('Connected to realtime voting updates')
          } else if (status === 'CLOSED') {
            console.log('Disconnected from realtime voting updates')
            isSubscribedRef.current = false
          }
        })

      channelRef.current = channel
    }

    setupChannel()

    // Cleanup
    return () => {
      componentMountedRef.current = false
      
      if (channelRef.current) {
        try {
          channelRef.current.unsubscribe()
          supabase.removeChannel(channelRef.current)
          console.log('Successfully cleaned up realtime channel')
        } catch (error) {
          console.error('Error during channel cleanup:', error)
        }
        
        channelRef.current = null
        isSubscribedRef.current = false
      }
      
      setIsConnected(false)
      setVoteCounts({})
    }
  }, [showId, initializeVoteCounts, handleVoteUpdate])

  // Component unmount cleanup
  useEffect(() => {
    return () => {
      componentMountedRef.current = false
    }
  }, [])

  // Get vote count for a specific setlist song
  const getVoteCount = useCallback((setlistSongId: string): number => {
    return voteCounts[setlistSongId] || 0
  }, [voteCounts])

  // Optimistically update vote count
  const optimisticVoteUpdate = useCallback((setlistSongId: string, increment: number = 1) => {
    setVoteCounts(prev => ({
      ...prev,
      [setlistSongId]: (prev[setlistSongId] || 0) + increment
    }))
  }, [])

  // Revert optimistic update if vote fails
  const revertVoteUpdate = useCallback((setlistSongId: string, decrement: number = 1) => {
    setVoteCounts(prev => ({
      ...prev,
      [setlistSongId]: Math.max(0, (prev[setlistSongId] || 0) - decrement)
    }))
  }, [])

  return {
    voteCounts,
    isConnected,
    getVoteCount,
    optimisticVoteUpdate,
    revertVoteUpdate,
    refreshVoteCounts: initializeVoteCounts
  }
}
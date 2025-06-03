// hooks/useRealtimeVotes.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

interface VoteUpdate {
  setlistSongId: string
  songId: string
  newVoteCount: number
  songTitle: string
  voterId: string
}

export function useRealtimeVotes(showId: string) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [latestUpdate, setLatestUpdate] = useState<VoteUpdate | null>(null)

  useEffect(() => {
    // Create a channel for this specific show
    const showChannel = supabase.channel(`show:${showId}`)
    
    // Listen to database changes on setlist_songs table
    showChannel
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'setlist_songs',
          filter: `setlist_id=in.(SELECT id FROM setlists WHERE show_id=eq.${showId})`
        },
        (payload) => {
          // When someone votes, the vote_count updates and we receive it here
          console.log('Vote update received:', payload)
          setLatestUpdate({
            setlistSongId: payload.new.id,
            songId: payload.new.song_id,
            newVoteCount: payload.new.vote_count,
            songTitle: '', // We'd need to fetch this separately or include in payload
            voterId: '' // Anonymous for privacy
          })
        }
      )
      // Also listen to custom broadcasts for richer updates
      .on('broadcast', { event: 'vote_update' }, (payload) => {
        console.log('Custom vote update:', payload)
        setLatestUpdate(payload.payload as VoteUpdate)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Listening to show ${showId} updates`)
        }
      })
    
    setChannel(showChannel)
    
    // Cleanup function
    return () => {
      if (showChannel) {
        supabase.removeChannel(showChannel)
      }
    }
  }, [showId])

  return { latestUpdate, channel }
}
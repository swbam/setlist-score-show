import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/use-toast'

interface VoteInput {
  songId: string
  showId: string
  setlistSongId?: string
}

interface VoteResult {
  success: boolean
  voteId?: string
  dailyVotesRemaining?: number
  showVotesRemaining?: number
  newVoteCount?: number
  error?: string
}

export function useVoting() {
  const queryClient = useQueryClient()
  const [isVoting, setIsVoting] = useState(false)

  const voteMutation = useMutation({
    mutationFn: async (input: VoteInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('You must be logged in to vote')
      }

      // Cast vote via RPC function (would be created in database)
      const { data, error } = await supabase
        .rpc('cast_vote', {
          p_user_id: user.id,
          p_show_id: input.showId,
          p_song_id: input.songId,
          p_setlist_song_id: input.setlistSongId
        })

      if (error) throw error
      return data
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['show', variables.showId] })
      queryClient.invalidateQueries({ queryKey: ['user-votes', variables.showId] })
      queryClient.invalidateQueries({ queryKey: ['vote-stats'] })

      // Show success toast
      toast({
        title: "Vote recorded!",
        description: `You have ${data.showVotesRemaining} votes left for this show.`,
        duration: 3000,
      })
    },
    onError: (error: Error) => {
      // Show error toast
      toast({
        title: "Vote failed",
        description: error.message,
        variant: "destructive",
        duration: 5000,
      })
    }
  })

  const vote = useCallback(async (input: VoteInput): Promise<VoteResult> => {
    setIsVoting(true)
    try {
      const result = await voteMutation.mutateAsync(input)
      return {
        success: true,
        voteId: result.voteId,
        dailyVotesRemaining: result.dailyVotesRemaining,
        showVotesRemaining: result.showVotesRemaining,
        newVoteCount: result.newVoteCount
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to cast vote'
      }
    } finally {
      setIsVoting(false)
    }
  }, [voteMutation])

  // Get user's votes for a show
  const getUserVotes = useCallback(async (showId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('user_id', user.id)
      .eq('show_id', showId)

    if (error) {
      console.error('Failed to fetch user votes:', error)
      return []
    }

    return data
  }, [])

  // Get vote statistics
  const getVoteStats = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString())

    if (error) {
      console.error('Failed to fetch vote stats:', error)
      return null
    }

    const dailyVotes = data.length
    const showVoteCounts = data.reduce((acc, vote) => {
      acc[vote.show_id] = (acc[vote.show_id] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      dailyVotes,
      dailyVotesRemaining: 50 - dailyVotes,
      showVoteCounts
    }
  }, [])

  return {
    vote,
    isVoting,
    getUserVotes,
    getVoteStats
  }
}
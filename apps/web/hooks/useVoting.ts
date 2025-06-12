import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

interface VoteInput {
  songId: string
  showId: string
  setlistSongId: string
}

interface VoteResult {
  success: boolean
  error?: string
  newVoteCount?: number
  votesRemaining?: {
    daily: number
    show: number
  }
}

export function useVoting() {
  const [isVoting, setIsVoting] = useState(false)
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const vote = async ({ songId, showId, setlistSongId }: VoteInput): Promise<VoteResult> => {
    if (!user) {
      return { success: false, error: 'Please sign in to vote' }
    }

    setIsVoting(true)
    
    try {
      // Call the voting API endpoint
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          songId,
          showId,
          setlistSongId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to vote' }
      }

      // Invalidate queries to refresh vote counts
      await queryClient.invalidateQueries({ queryKey: ['show', showId] })
      await queryClient.invalidateQueries({ queryKey: ['userVotes', showId] })

      return {
        success: true,
        newVoteCount: data.newVoteCount,
        votesRemaining: data.votesRemaining,
      }
    } catch (error) {
      console.error('Vote error:', error)
      return { success: false, error: 'Network error. Please try again.' }
    } finally {
      setIsVoting(false)
    }
  }

  return {
    vote,
    isVoting,
  }
}
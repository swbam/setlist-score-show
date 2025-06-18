// components/voting/VoteButton.tsx
'use client'

import { useState } from 'react'
import { Heart, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface VoteButtonProps {
  songId: string
  showId: string
  setlistSongId?: string
  currentVotes: number
  hasVoted: boolean
  position: number
  onVote: (songId: string, setlistSongId: string) => Promise<void>
  disabled?: boolean
  isLoading?: boolean
  className?: string
}

export function VoteButton({
  songId,
  showId,
  setlistSongId,
  currentVotes,
  hasVoted,
  position,
  onVote,
  disabled = false,
  isLoading = false,
  className
}: VoteButtonProps) {
  const [isVoting, setIsVoting] = useState(false)
  const [justVoted, setJustVoted] = useState(false)
  const { user } = useAuth()

  const handleVote = async () => {
    if (!setlistSongId || disabled || isVoting || hasVoted) return

    // Check if user is logged in
    if (!user) {
      // Redirect to login or show login modal
      window.location.href = '/login'
      return
    }

    setIsVoting(true)
    
    try {
      await onVote(songId, setlistSongId)
      setJustVoted(true)
      
      // Reset the "just voted" state after animation
      setTimeout(() => setJustVoted(false), 2000)
    } catch (error) {
      console.error('Vote failed:', error)
      // You could show an error toast here
    } finally {
      setIsVoting(false)
    }
  }

  const buttonVariant = hasVoted ? 'default' : 'outline'
  const buttonState = isVoting || isLoading

  return (
    <Button
      onClick={handleVote}
      disabled={disabled || buttonState || hasVoted}
      variant={buttonVariant}
      size="sm"
      className={cn(
        "relative min-w-[80px] transition-all duration-200",
        hasVoted && "bg-primary text-primary-foreground hover:bg-primary/90",
        justVoted && "scale-110",
        !user && "opacity-75",
        className
      )}
    >
      {buttonState ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin mr-1" />
          Voting...
        </>
      ) : hasVoted ? (
        <>
          <Check className="w-4 h-4 mr-1" />
          Voted
        </>
      ) : (
        <>
          <Heart className={cn(
            "w-4 h-4 mr-1 transition-colors",
            !user && "opacity-50"
          )} />
          Vote
        </>
      )}
      
      {/* Vote count badge */}
      {currentVotes > 0 && (
        <span className={cn(
          "absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center font-medium",
          hasVoted && "bg-primary-foreground text-primary"
        )}>
          {currentVotes}
        </span>
      )}
    </Button>
  )
}
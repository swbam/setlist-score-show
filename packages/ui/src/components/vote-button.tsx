import { useState } from 'react'
import { cn } from "../lib/utils";
import { Button } from "./button";

interface VoteButtonProps {
  songId: string
  showId: string
  voteCount: number
  hasVoted: boolean
  onVote: (songId: string, showId: string) => Promise<{ success: boolean }>
  isVoting?: boolean
  disabled?: boolean
  className?: string
}

export function VoteButton({
  songId,
  showId,
  voteCount,
  hasVoted,
  onVote,
  isVoting = false,
  disabled = false,
  className,
}: VoteButtonProps) {
  const [currentVotes, setCurrentVotes] = useState(voteCount)

  const handleVote = async () => {
    if (hasVoted || isVoting) return
    
    const result = await onVote(songId, showId)
    if (result.success) {
      setCurrentVotes(prev => prev + 1)
    }
  }

  return (
    <Button
      onClick={handleVote}
      disabled={disabled || hasVoted || isVoting}
      variant={hasVoted ? "default" : "outline"}
      className={cn(
        "relative overflow-hidden transition-all duration-300 group",
        hasVoted
          ? "bg-white text-black shadow-lg border-2 border-gray-300"
          : "bg-transparent text-white border-gray-600 hover:bg-white hover:text-black",
        className
      )}
    >
      {hasVoted && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-white rounded-lg"
          style={{ zIndex: 1 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">
        <span className="text-sm font-medium">
          {hasVoted ? "Voted" : "Vote"}
        </span>
        {currentVotes > 0 && (
          <span className="text-xs opacity-80">
            ({currentVotes})
          </span>
        )}
      </span>
    </Button>
  );
}
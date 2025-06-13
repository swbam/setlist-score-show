// components/voting/VoteButton.tsx
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronUp, Check } from 'lucide-react'
import { useVoting } from '@/hooks/useVoting'
import { motion } from 'framer-motion'

interface VoteButtonProps {
  songId: string
  showId: string
  setlistSongId?: string
  currentVotes: number
  hasVoted: boolean
  position: number
  onVote?: (songId: string) => Promise<void>
  disabled?: boolean
}

export function VoteButton({ 
  songId, 
  showId, 
  setlistSongId,
  currentVotes, 
  hasVoted, 
  position,
  onVote,
  disabled = false
}: VoteButtonProps) {
  const { vote, isVoting } = useVoting()
  const [showSuccess, setShowSuccess] = useState(false)

  const handleVote = async () => {
    if (hasVoted || isVoting || disabled) return
    
    if (onVote) {
      await onVote(songId)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
    } else if (setlistSongId) {
      const result = await vote({ songId, showId, setlistSongId })
      if (result.success) {
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 2000)
      }
    }
  }

  return (
    <div className="flex flex-col items-center w-12">
      <span className="font-headline font-semibold text-base leading-none text-foreground mb-1">
        {currentVotes}
      </span>

      <motion.button
        whileHover={{ y: hasVoted ? 0 : -2 }}
        whileTap={{ scale: hasVoted ? 1 : 0.9 }}
        onClick={handleVote}
        disabled={hasVoted || isVoting || disabled}
        className={cn(
          "flex items-center justify-center p-1 transition-colors",
          hasVoted || disabled
            ? "text-primary cursor-default"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {showSuccess ? (
          <Check className="w-5 h-5 text-green-400" />
        ) : (
          <ChevronUp className="w-5 h-5" />
        )}
      </motion.button>
    </div>
  )
}
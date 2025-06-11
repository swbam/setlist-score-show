// components/voting/VoteButton.tsx
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronUp, Check } from 'lucide-react'
import { useVoting } from '@/hooks/useVoting'
import { motion, AnimatePresence } from 'framer-motion'

interface VoteButtonProps {
  songId: string
  showId: string
  currentVotes: number
  hasVoted: boolean
  position: number
  onVote?: (songId: string) => Promise<void>
  disabled?: boolean
}

export function VoteButton({ 
  songId, 
  showId, 
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
    } else {
      const result = await vote({ songId, showId })
      if (result.success) {
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 2000)
      }
    }
  }

  return (
    <motion.button
      whileHover={{ scale: hasVoted ? 1 : 1.05 }}
      whileTap={{ scale: hasVoted ? 1 : 0.95 }}
      onClick={handleVote}
      disabled={hasVoted || isVoting || disabled}
      className={cn(
        "relative flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-medium transition-all duration-200 min-w-[60px]",
        hasVoted
          ? "bg-gray-700 text-gray-300 cursor-default"
          : "bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600"
      )}
    >
      <AnimatePresence mode="wait">
        {showSuccess ? (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            className="absolute inset-0 flex items-center justify-center bg-gray-700 rounded-lg"
          >
            <Check className="w-4 h-4 text-green-400" />
          </motion.div>
        ) : (
          <>
            <ChevronUp className="w-4 h-4" />
            <span className="text-sm">{currentVotes}</span>
          </>
        )}
      </AnimatePresence>
      
      {hasVoted && (
        <span className="text-xs opacity-60 ml-1">Vote</span>
      )}
    </motion.button>
  )
}